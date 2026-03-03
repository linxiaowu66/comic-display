export interface Character {
  id: number;
  name: string;
  prompt: string;
  type: number;
  description: string;
  resourceUrl: string[];
  artStyle: string;
  artStyleId: number;
  useModel: string;
  proportion: string;
  isStar: number;
  userID: number;
  taskId: number;
  taskStatus: number;
  referenceImage: string | null;
  voiceId: number;
}

export interface CharacterLibraryResponse {
  code: string;
  msg: string;
  result: {
    characters: Character[];
  };
}
