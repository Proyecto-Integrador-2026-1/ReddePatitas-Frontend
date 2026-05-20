const REPORTS_URL =
	(import.meta.env.VITE_REPORTS_URL as string) ||
	"http://localhost:8080/api/reports";

async function handleRes(res: Response) {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
}

export async function resolveReport(id: string, dto: { reencontrado: boolean; mensaje?: string }, userId: string) {
    if (!id) throw new Error('missing_report_id');
    if (!userId) throw new Error('missing_user_id');

    const res = await fetch(`${REPORTS_URL}/${id}/resolve`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': String(userId),
            Accept: 'application/json',
        },
        body: JSON.stringify(dto),
    });

    return handleRes(res);
}

export default { resolveReport };
