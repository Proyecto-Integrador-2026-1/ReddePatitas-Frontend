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

import { getValidToken } from "../utils/jwt";

export async function resolveReport(id: string, dto: { reencontrado: boolean; mensaje?: string }) {
    if (!id) throw new Error('missing_report_id');

    const token = getValidToken();
    if (!token) throw new Error('missing_token');

    const res = await fetch(`${REPORTS_URL}/${id}/resolve`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            Accept: 'application/json',
        },
        body: JSON.stringify(dto),
    });

    return handleRes(res);
}

export default { resolveReport };
