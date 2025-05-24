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
import { User, Mail, Lock, UserPlus, Loader2 } from "lucide-react"

export default function CadastroPage() {
  const [name, setName] = useState("")
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

    try {
      // Simular delay de rede
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (name.trim() && email.trim() && password.trim()) {
        alert("Cadastro bem-sucedido! Use as credenciais: admin@teste.com / 123456 para fazer login.")
        router.push("/")
        return
      }

      const response = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        alert("Cadastro bem-sucedido!")
        router.push("/")
      } else {
        setError("Erro ao cadastrar. Tente novamente.")
      }
    } catch (error) {
      alert("Cadastro simulado com sucesso! Use as credenciais: admin@teste.com / 123456 para fazer login.")
      router.push("/")
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
          <CardTitle className="text-2xl font-bold text-center text-white animate-slide-in">Cadastro</CardTitle>
          <CardDescription className="text-center text-zinc-400 animate-slide-in" style={{ animationDelay: "0.1s" }}>
            Crie sua conta para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.2s" }}>
              <Label htmlFor="name" className="text-zinc-200">
                Nome
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400 transition-colors-smooth" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

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
                  Cadastrando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4 transition-transform-smooth" />
                  Cadastrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center animate-slide-in" style={{ animationDelay: "0.6s" }}>
            <Link
              href="/"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors-smooth"
            >
              Já tem conta? Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
