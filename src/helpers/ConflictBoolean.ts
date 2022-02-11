// Determines if a conflict exists in this record
export default function ConflictBoolean(bibNum: number, checkerBib: number): boolean {
	return bibNum !== undefined && bibNum !== null && checkerBib !== undefined && checkerBib !== null && checkerBib !== 0 && bibNum !== 0 && checkerBib !== bibNum;
}