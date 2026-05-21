
export async function fetchUvIndex(latitude: number, longitude: number) {
	const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=uv_index&current=uv_index`;
	const res = await fetch(url);
	if (!res.ok) throw new Error("Failed to fetch UV index data");
	const data = await res.json();

	return {
		latitude: data.latitude,
		longitude: data.longitude,
		elevation: data.elevation,
		timezone: data.timezone,
		timezone_abbreviation: data.timezone_abbreviation,
		current: {
			time: data.hourly?.time?.[0] ? new Date(data.hourly.time[0]) : null,
			uv_index: data.hourly?.uv_index?.[0] ?? null,
		},
		hourly: {
			time: data.hourly?.time?.map((t: string) => new Date(t)) ?? [],
			uv_index: data.hourly?.uv_index ?? [],
			units: data.hourly_units?.uv_index ?? "",
		},
	};
}
