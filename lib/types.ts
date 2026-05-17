export interface StoredItem {
  website: string;
  url: string;
  username: string;
  encPassword: string;
  encNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListItem {
  id: string;
  website: string;
  url: string;
  username: string;
  notes: string;
  createdAt: string;
}

export interface DecryptedItem extends ListItem {
  password: string;
}
