import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BookingRecord = {
  id: string;
  name: string;
  phone: string | null;
  service: string;
  service_id: string | null;
  service_duration_minutes: number | null;
  service_price_label: string | null;
  date: string;
  time: string;
  end_time: string | null;
  notes: string | null;
  source: string | null;
  status: string | null;
  calendar_event_id: string | null;
};

type SyncPayload = {
  action: "upsert" | "delete";
  bookingId: string;
  snapshot?: Partial<BookingRecord>;
};

function base64UrlEncode(input: ArrayBuffer | string) {
  const raw =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  const base64 = btoa(String.fromCharCode(...raw));
  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function normalizePrivateKey(value: string) {
  return value.replaceAll("\\n", "\n");
}

async function signJwt(serviceAccountEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const pemBody = normalizePrivateKey(privateKey)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replaceAll(/\s/g, "");

  const binary = Uint8Array.from(atob(pemBody), (char) => char.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binary.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureBase = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureBase),
  );

  return `${signatureBase}.${base64UrlEncode(signature)}`;
}

async function getGoogleAccessToken() {
  const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");

  if (!serviceAccountEmail || !privateKey) {
    throw new Error("Google service account env belum lengkap.");
  }

  const assertion = await signJwt(serviceAccountEmail, privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || "Gagal mengambil Google access token.");
  }

  return data.access_token as string;
}

async function googleCalendarRequest(
  path: string,
  init: RequestInit = {},
) {
  const token = await getGoogleAccessToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gagal akses Google Calendar API.");
  }

  return payload;
}

function buildEventBody(booking: BookingRecord) {
  const timezone = "Asia/Jakarta";
  const endTime = booking.end_time || booking.time;

  return {
    summary: `${booking.name} - ${booking.service}`,
    description: [
      `Booking ID: ${booking.id}`,
      `Nama: ${booking.name}`,
      `HP: ${booking.phone || "-"}`,
      `Service: ${booking.service}`,
      `Source: ${booking.source || "website"}`,
      `Catatan: ${booking.notes || "-"}`,
    ].join("\n"),
    start: {
      dateTime: `${booking.date}T${booking.time}:00`,
      timeZone: timezone,
    },
    end: {
      dateTime: `${booking.date}T${endTime}:00`,
      timeZone: timezone,
    },
  };
}

async function getBookingRecord(
  supabaseAdmin: ReturnType<typeof createClient>,
  bookingId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, name, phone, service, service_id, service_duration_minutes, service_price_label, date, time, end_time, notes, source, status, calendar_event_id",
    )
    .eq("id", bookingId)
    .single();

  if (error) {
    throw error;
  }

  return data as BookingRecord;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID");

  if (!supabaseUrl || !serviceRoleKey || !calendarId) {
    return new Response(
      JSON.stringify({ error: "Supabase atau Google Calendar env belum lengkap." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const payload = (await request.json()) as SyncPayload;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const booking = payload.snapshot?.id
      ? ({ ...payload.snapshot } as BookingRecord)
      : await getBookingRecord(supabaseAdmin, payload.bookingId);

    if (payload.action === "delete" || booking.status === "cancelled") {
      if (booking.calendar_event_id) {
        try {
          await googleCalendarRequest(
            `calendars/${encodeURIComponent(calendarId)}/events/${booking.calendar_event_id}`,
            {
              method: "DELETE",
            },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Delete event gagal.";
          if (!message.includes("Not Found")) {
            throw error;
          }
        }
      }

      await supabaseAdmin
        .from("bookings")
        .update({
          calendar_event_id: null,
          calendar_sync_status: "synced",
          calendar_sync_error: "",
        })
        .eq("id", payload.bookingId);

      return new Response(JSON.stringify({ ok: true, action: "delete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventBody = buildEventBody(booking);
    let eventId = booking.calendar_event_id;

    if (eventId) {
      await googleCalendarRequest(
        `calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: "PATCH",
          body: JSON.stringify(eventBody),
        },
      );
    } else {
      const created = await googleCalendarRequest(
        `calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          body: JSON.stringify(eventBody),
        },
      );
      eventId = created.id as string;
    }

    await supabaseAdmin
      .from("bookings")
      .update({
        calendar_event_id: eventId,
        calendar_sync_status: "synced",
        calendar_sync_error: "",
      })
      .eq("id", payload.bookingId);

    return new Response(JSON.stringify({ ok: true, action: "upsert", eventId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync gagal.";

    await supabaseAdmin
      .from("bookings")
      .update({
        calendar_sync_status: "error",
        calendar_sync_error: message,
      })
      .eq("id", payload.bookingId);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
