/** Remove one element from a list */
export default function RemoveOne<T>(index: number, list: Array<T>): Array<T> {
	list = list.filter((_, i) => i !== index);
	return list;
}