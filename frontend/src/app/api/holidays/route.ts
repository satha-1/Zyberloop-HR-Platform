import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  if (!year) {
    return NextResponse.json({ error: "Year is required" }, { status: 400 });
  }

  let mappedHolidays: any[] = [];

  // 1. Try GitHub raw data
  try {
    const githubRes = await fetch(
      `https://raw.githubusercontent.com/Dilshan-H/srilanka-holidays/main/json/${year}.json`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours to prevent spamming the API
      },
    );

    if (githubRes.ok) {
      const data = await githubRes.json();
      if (Array.isArray(data)) {
        mappedHolidays = data.map((h: any) => ({
          date: h.start, // Format is "YYYY-MM-DD"
          name: h.summary,
        }));
        return NextResponse.json({ holidays: mappedHolidays });
      } else {
        console.warn("Invalid API format received from GitHub", data);
      }
    } else {
      console.warn("GitHub raw API failed with status:", githubRes.status);
    }
  } catch (e) {
    console.error("GitHub API Error:", e);
  }

  // 2. Fallback to Calendarific
  try {
    const apiKey = process.env.NEXT_PUBLIC_HOLIDAY_API_KEY;
    if (!apiKey) {
      console.warn(
        "No Holiday API key (NEXT_PUBLIC_HOLIDAY_API_KEY) found for fallback.",
      );
      return NextResponse.json({ holidays: [] });
    }

    const fallbackRes = await fetch(
      `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=LK&year=${year}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    );

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data.response && data.response.holidays) {
        mappedHolidays = data.response.holidays.map((h: any) => ({
          date: h.date.iso, // ISO string 'YYYY-MM-DD'
          name: h.name,
        }));
        return NextResponse.json({ holidays: mappedHolidays });
      } else {
        console.warn("Invalid API response format from fallback", data);
      }
    } else {
      console.error("Calendarific API failed with status:", fallbackRes.status);
    }
  } catch (fallbackError) {
    console.error("Secondary Holiday API Error:", fallbackError);
  }

  // If both APIs fail, return an empty array so the frontend doesn't crash
  return NextResponse.json({ holidays: [] });
}
