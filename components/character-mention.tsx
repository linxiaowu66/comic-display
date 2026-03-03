"use client";

import { useMemo } from "react";
import type { Character } from "@/lib/types/character";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CharacterMentionProps {
  html: string;
  characterMap: Map<number, Character>;
}

interface ParsedNode {
  type: "text" | "character";
  content: string;
  characterId?: number;
  characterName?: string;
}

export function CharacterMention({ html, characterMap }: CharacterMentionProps) {
  const nodes = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const result: ParsedNode[] = [];

    function traverseNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text) {
          result.push({
            type: "text",
            content: text,
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        
        if (
          element.tagName === "SPAN" &&
          element.getAttribute("data-type") === "prompt-mention"
        ) {
          const characterId = parseInt(element.getAttribute("data-value") || "0", 10);
          const characterName = element.textContent || "";
          
          result.push({
            type: "character",
            content: characterName,
            characterId,
            characterName,
          });
        } else {
          node.childNodes.forEach(traverseNode);
        }
      }
    }

    doc.body.childNodes.forEach(traverseNode);
    return result;
  }, [html]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="whitespace-pre-wrap">
        {nodes.map((node, index) => {
          if (node.type === "text") {
            return <span key={index}>{node.content}</span>;
          }

          const character = characterMap.get(node.characterId!);

          if (!character) {
            return (
              <span
                key={index}
                className="text-muted-foreground/60 font-mono text-xs"
              >
                {node.characterName}
              </span>
            );
          }

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded cursor-help hover:bg-primary/20 transition-colors">
                  {character.name}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-sm p-0 overflow-hidden bg-card border-border"
              >
                <div className="flex gap-3 p-3">
                  {character.resourceUrl && character.resourceUrl.length > 0 && (
                    <div className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={character.resourceUrl[0]}
                        alt={character.name}
                        className="w-16 h-20 object-cover rounded border border-border"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1">
                      {character.name}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {character.prompt}
                    </div>
                    {character.description && (
                      <div className="text-xs text-muted-foreground/80 line-clamp-3 border-t border-border/50 pt-2">
                        {character.description}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
