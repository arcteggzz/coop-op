export interface Note {
  Id: number; // auto_increment integer in the Notes table
  Title: string;
  Content: string;
  IsCompleted: boolean;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}
