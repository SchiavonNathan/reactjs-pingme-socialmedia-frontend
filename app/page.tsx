"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Mail, Lock, LogIn, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Credenciais fixas para teste
    const mockCredentials = {
      email: "admin@teste.com",
      password: "123456",
    }

    try {
      // Verificar credenciais mock primeiro
      if (email === mockCredentials.email && password === mockCredentials.password) {
        // Simular dados do usuário mock
        const mockUser = {
          id: 1,
          name: "Usuário Teste",
          email: "admin@teste.com",
          fotoPerfil: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          biografia: "Usuário de teste da aplicação",
        }

        localStorage.setItem("access_token", "mock_token_123")
        localStorage.setItem("user_id", "1")
        localStorage.setItem("logado", "true")
        localStorage.setItem("mock_user", JSON.stringify(mockUser))

        // Criar alguns posts mock se não existirem
        if (!localStorage.getItem("mock_posts")) {
          const mockPosts = [
            {
              id: 1,
              titulo: "Bem-vindos ao PingMe!",
              conteudo:
                "Esta é uma postagem de exemplo para demonstrar as funcionalidades da nossa rede social. Você pode curtir, comentar e compartilhar!",
              tags: "exemplo, teste, rede-social",
              foto: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500&h=300&fit=crop",
              data_criacao: new Date().toISOString(),
              usuario: mockUser,
              likesCount: 5,
            },
            {
              id: 2,
              titulo: "Funcionalidades da Plataforma",
              conteudo:
                "Nossa plataforma oferece diversas funcionalidades como criação de posts, sistema de comentários, perfis personalizáveis e muito mais!",
              tags: "funcionalidades, plataforma, recursos",
              foto: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
              data_criacao: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
              usuario: mockUser,
              likesCount: 12,
            },
            {
              id: 3,
              titulo: "Compartilhe suas ideias",
              conteudo:
                "Use nossa plataforma para compartilhar suas ideias, conectar-se com outros usuários e descobrir conteúdos interessantes!",
              tags: "ideias, compartilhar, comunidade",
              data_criacao: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
              usuario: mockUser,
              likesCount: 8,
            },
          ]
          localStorage.setItem("mock_posts", JSON.stringify(mockPosts))
        }

        // Pequeno delay para mostrar a animação de loading
        await new Promise((resolve) => setTimeout(resolve, 800))
        router.push("/home")
        return
      }

      // Tentar login real com backend se as credenciais mock não funcionarem
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("user_id", data.user_id)
        localStorage.setItem("logado", "true")
        router.push("/home")
      } else {
        setError("Email ou senha incorretos. Tente: admin@teste.com / 123456")
      }
    } catch (error) {
      setError("Erro ao fazer login. Use as credenciais de teste: admin@teste.com / 123456")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin-slow">
          <Loader2 className="h-8 w-8 text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 hover-lift animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white animate-slide-in">Login</CardTitle>
          <CardDescription className="text-center text-zinc-400 animate-slide-in" style={{ animationDelay: "0.1s" }}>
            Entre na sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Credenciais de Teste */}
          <div
            className="mb-6 p-4 bg-blue-950/50 rounded-lg border border-blue-800/50 animate-slide-in hover-glow"
            style={{ animationDelay: "0.2s" }}
          >
            <h3 className="font-semibold text-blue-300 mb-2">Credenciais de Teste</h3>
            <p className="text-sm text-blue-200">
              <strong>Email:</strong> admin@teste.com
              <br />
              <strong>Senha:</strong> 123456
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.3s" }}>
              <Label htmlFor="email" className="text-zinc-200">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400 transition-colors-smooth" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.4s" }}>
              <Label htmlFor="password" className="text-zinc-200">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400 transition-colors-smooth" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-800/50 animate-scale-in">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white btn-animate transition-all-smooth animate-slide-in"
              disabled={loading}
              style={{ animationDelay: "0.5s" }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4 transition-transform-smooth group-hover:scale-110" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center animate-slide-in" style={{ animationDelay: "0.6s" }}>
            <Link
              href="/cadastro"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors-smooth"
            >
              Não tem conta? Cadastre-se
            </Link>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-500 animate-slide-in" style={{ animationDelay: "0.7s" }}>
            Copyright © 2024 PingMe LTDA
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
