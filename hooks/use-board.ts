// hooks/use-board.ts
import { useQuery } from "@tanstack/react-query";
import { boardService } from "@/services";
import { queryKeys } from "@/config/query";

export function useBoards() {
  return useQuery({
    queryKey: queryKeys.boards.all,
    queryFn: () => boardService.getBoards(),
  });
}
