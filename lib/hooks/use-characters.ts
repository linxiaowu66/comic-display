import { useEffect } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/api";
import type { Character, CharacterLibraryResponse } from "@/lib/types/character";

export function useCharacters(
  projectId: number | null,
  token: string,
  isAdmin: boolean = true
) {
  const { data, isLoading, error } = useSWR<
    CharacterLibraryResponse | { data: Character[] }
  >(
    projectId
      ? isAdmin
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
        : `/api/cache?type=characters&id=${projectId}`
      : null,
    isAdmin
      ? apiFetcher
      : (url: string) => fetch(url).then((r) => r.json())
  );

  const characters: Character[] = isAdmin
    ? (data as CharacterLibraryResponse)?.result?.characters ?? []
    : (data as { data: Character[] })?.data ?? [];

  const characterMap = new Map(characters.map((char) => [char.id, char]));

  // Admin: cache characters to server
  useEffect(() => {
    if (isAdmin && characters.length > 0 && projectId) {
      fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "characters",
          id: projectId,
          data: characters,
        }),
      }).catch(() => {});
    }
  }, [isAdmin, characters, projectId]);

  return {
    characters,
    characterMap,
    isLoading,
    error,
  };
}
