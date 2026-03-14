"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      console.log("Login response:", res);

      if (res.ok) {
        const data = await res.json();
        
        // Save admin status locally for client-side UI rendering
        if (data.isAdmin) {
          localStorage.setItem("isJzOwner", "true");
        } else {
          localStorage.removeItem("isJzOwner");
        }

        toast({
          title: "登录成功",
          description: "欢迎来到漫剧展示",
        });
        router.push("/");
        router.refresh(); // Refresh to update the UI (like top-bar)
      } else {
        const data = await res.json();
        toast({
          title: "登录失败",
          description: data.error || "用户名或密码错误",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "错误",
        description: "发生未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-slate-100 overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>
      
      <Card className="w-[400px] z-10 border-slate-800 bg-slate-950/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 pb-6 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            漫剧秀
          </CardTitle>
          <CardDescription className="text-slate-400 font-mono text-sm">
            请输入您的凭证以访问漫剧展示平台
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 font-mono text-xs uppercase tracking-wider">用户名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-slate-100 focus:ring-blue-500 focus:border-blue-500 font-mono transition-all duration-300"
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-mono text-xs uppercase tracking-wider">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-slate-100 focus:ring-blue-500 focus:border-blue-500 font-mono transition-all duration-300"
                placeholder="••••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
            >
              {isLoading ? "正在验证..." : "登录系统"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-800/50 pt-4 mt-2">
          <p className="text-[10px] text-slate-500 font-mono">
            安全连接 • 加密协议
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
