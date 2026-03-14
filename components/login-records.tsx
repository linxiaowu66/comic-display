"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { LoginRecord } from "@/lib/server-storage";
import { Card, CardContent } from "@/components/ui/card";

export function LoginRecords() {
  const [records, setRecords] = useState<LoginRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/logins");
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (err) {
      toast({
        title: "获取记录失败",
        description: "无法加载登录日志",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="border-dashed mt-4">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium mb-2">暂无登录记录</p>
          <p className="text-xs text-muted-foreground">这里将显示除管理员外的用户登录历史</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border mt-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>用户名</TableHead>
            <TableHead>IP 地址</TableHead>
            <TableHead className="text-right">登录时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium text-sm">{record.username}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{record.ip}</TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {new Date(record.timestamp).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
