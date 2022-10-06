/** 
 * Record used in Results Mode to combine Finish Times, Bib Numbers, and Checker Bibs into a single object;
 * [123, 308192, 123] --> Bib Number and Checker Bib both recorded accurately;
 * [123, 308192, 0] --> Only Bib Number recorded, not Checker Bib;
 * [123, 308192, 784] --> Conflict
 */
export type VRecord = [bibNum: number, finishTime: number, checkerBib: number];