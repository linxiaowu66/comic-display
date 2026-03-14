"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, KeyRound, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { AppUser } from "@/lib/server-storage";

export function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      toast({
        title: "获取用户失败",
        description: "无法加载用户列表",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddUser() {
    if (!newUsername.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, newUser]);
        setNewUsername("");
        setIsAdding(false);
        toast({ title: "用户创建成功", description: "请复制密码给用户" });
      } else {
        const data = await res.json();
        toast({ title: "创建失败", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "错误", description: "请求失败", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("确定要删除此用户吗？")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        toast({ title: "已删除", description: "用户已被删除" });
      } else {
        const data = await res.json();
        toast({ title: "删除失败", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "错误", description: "请求失败", variant: "destructive" });
    }
  }

  async function handleResetPassword(id: string) {
    if (!confirm("确定要重置该用户的密码吗？旧密码将失效。")) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === id ? updatedUser : u));
        toast({ title: "密码已重置", description: "请复制新密码给用户" });
      } else {
        const data = await res.json();
        toast({ title: "重置失败", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "错误", description: "请求失败", variant: "destructive" });
    }
  }

  function handleCopyPassword(password: string) {
    navigator.clipboard.writeText(password);
    setCopiedPassword(password);
    setTimeout(() => setCopiedPassword(null), 2000);
  }

  if (isLoading) {
    return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 py-4">
      {users.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium mb-2">暂无用户</p>
            <p className="text-xs text-muted-foreground">添加用户以允许登录</p>
          </CardContent>
        </Card>
      )}

      {users.map(user => (
        <Card key={user.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">{user.username}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  创建于: {new Date(user.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleResetPassword(user.id)}
                >
                  <KeyRound className="size-3.5" />
                  重置密码
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">密码</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-xs tracking-wider">
                  {user.password}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => handleCopyPassword(user.password)}
                >
                  {copiedPassword === user.password ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {isAdding && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">添加新用户</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="输入登录用户名"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddUser} disabled={!newUsername.trim() || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 size-4 animate-spin" />}
                保存
              </Button>
              <Button variant="outline" onClick={() => { setIsAdding(false); setNewUsername(""); }}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAdding && (
        <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 size-4" />
          添加用户
        </Button>
      )}
    </div>
  );
}
