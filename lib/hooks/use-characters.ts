import useSWR from "swr";
import { apiFetcher } from "@/lib/api";
import type { CharacterLibraryResponse } from "@/lib/types/character";

export function useCharacters(projectId: number | null, token: string) {
  const { data, isLoading, error } = useSWR<CharacterLibraryResponse>(
    projectId
      ? [
          "/storyboard/api/libraryList",
          token,
          {
            method: "POST" as const,
            params: {
              projectId,
              type: 1,
            },
          },
        ]
      : null,
    apiFetcher
  );

  const characters = data?.result?.characters ?? [];
  const characterMap = new Map(characters.map((char) => [char.id, char]));

  return {
    characters,
    characterMap,
    isLoading,
    error,
  };
}
