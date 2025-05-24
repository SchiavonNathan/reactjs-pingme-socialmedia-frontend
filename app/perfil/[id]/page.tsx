"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, MoreHorizontal, Heart, MessageCircle, Share2, User, Edit } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface UserProfile {
  id: number
  name: string
  email: string
  fotoPerfil?: string
  biografia?: string
}

interface Post {
  id: number
  titulo: string
  conteudo: string
  tags: string
  foto?: string
  data_criacao: string
  usuario: UserProfile
  likesCount?: number
}

export default function PerfilPage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string
  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [name, setName] = useState("")
  const [biografia, setBiografia] = useState("")
  const [fotoPerfil, setFotoPerfil] = useState("")

  useEffect(() => {
    if (!userId) {
      router.push("/")
      return
    }
    const mockUser = localStorage.getItem("mock_user")
    const mockPosts = localStorage.getItem("mock_posts")
    if (mockUser && profileId === "1") {
      const u = JSON.parse(mockUser)
      setCurrentUser(u)
      setProfileUser(u)
      setName(u.name)
      setBiografia(u.biografia || "")
      setFotoPerfil(u.fotoPerfil || "")
      if (mockPosts) {
        const all = JSON.parse(mockPosts)
        setPosts(all.filter((p: Post) => p.usuario.id === Number(profileId)))
      }
      return
    }
    fetch(`http://localhost:3001/users/${userId}`)
      .then((r) => r.json())
      .then(setCurrentUser)
      .catch(console.error)
    fetch(`http://localhost:3001/users/${profileId}`)
      .then((r) => r.json())
      .then((u) => {
        setProfileUser(u)
        setName(u.name)
        setBiografia(u.biografia || "")
        setFotoPerfil(u.fotoPerfil || "")
      })
      .catch(console.error)
    fetch(`http://localhost:3001/postagens/usuario/${profileId}`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = data.sort((a: Post, b: Post) =>
          new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
        )
        setPosts(sorted)
      })
      .catch(console.error)
  }, [profileId, userId, router])

  const handleUpdateProfile = async () => {
    const mockUser = localStorage.getItem("mock_user")
    if (mockUser) {
      const updated = { ...JSON.parse(mockUser), name, biografia, fotoPerfil }
      localStorage.setItem("mock_user", JSON.stringify(updated))
      setCurrentUser(updated)
      setProfileUser(updated)
      setIsEditProfileOpen(false)
      return
    }
    const res = await fetch(`http://localhost:3001/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, biografia, fotoPerfil }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProfileUser(updated)
      setIsEditProfileOpen(false)
    }
  }

  const handleDeletePost = async (postId: number) => {
    const mockPosts = localStorage.getItem("mock_posts")
    if (mockPosts) {
      const all = JSON.parse(mockPosts)
      const upd = all.filter((p: Post) => p.id !== postId)
      localStorage.setItem("mock_posts", JSON.stringify(upd))
      setPosts((ps) => ps.filter((p) => p.id !== postId))
      return
    }
    await fetch(`http://localhost:3001/postagens/${postId}`, { method: "DELETE" })
    setPosts((ps) => ps.filter((p) => p.id !== postId))
  }

  const isOwnProfile = currentUser?.id === profileUser?.id

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-zinc-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Perfil</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 sm:p-8 text-center">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4">
                <AvatarImage src={profileUser?.fotoPerfil || "/placeholder.svg"} alt={profileUser?.name} />
                <AvatarFallback className="bg-zinc-700">
                  <User className="h-16 w-16 text-zinc-300" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">{profileUser?.name}</h2>
              {profileUser?.biografia && <p className="text-zinc-300 mb-4">{profileUser.biografia}</p>}
              {isOwnProfile ? (
                <Button onClick={() => setIsEditProfileOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Button>
              ) : (
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Copiar Link do Perfil
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 text-white">Postagens</h3>
          {posts.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 text-center">
                <p className="text-zinc-400">Nenhuma postagem encontrada</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 cursor-pointer" onClick={() => router.push(`/perfil/${post.usuario.id}`)}>
                        <AvatarImage src={post.usuario.fotoPerfil || "/placeholder.svg"} alt={post.usuario.name} />
                        <AvatarFallback className="bg-zinc-700">
                          <User className="h-4 w-4 text-zinc-300" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-blue-400 hover:underline cursor-pointer" onClick={() => router.push(`/perfil/${post.usuario.id}`)}>
                          {post.usuario.name}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {formatDistanceToNow(new Date(post.data_criacao), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="self-end sm:self-auto text-zinc-400 hover:text-zinc-200">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-800 border-zinc-700">
                        {isOwnProfile && (
                          <>
                            <DropdownMenuItem onClick={() => {/* editar lógica */}} className="text-zinc-200 hover:bg-zinc-700">
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:bg-zinc-700">
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/postagem/${post.id}`); alert("Link copiado!") }} className="text-zinc-200 hover:bg-zinc-700">
                          Copiar Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent onClick={() => router.push(`/postagem/${post.id}`)} className="cursor-pointer">
                  <CardTitle className="mb-3 text-lg sm:text-xl text-white">{post.titulo}</CardTitle>
                  <p className="text-zinc-300 mb-4">{post.conteudo}</p>
                  {post.foto && (
                    <img src={post.foto} alt="Post image" className="w-full rounded-lg mb-4 max-h-52 sm:max-h-96 object-cover" />
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.split(",").map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-zinc-400">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); /* curtir lógica */ }} className="hover:text-red-400">
                      <Heart className="mr-1 h-4 w-4" /> {post.likesCount || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="px-2 py-1 text-sm text-zinc-400 hover:text-blue-400">
                      <MessageCircle className="mr-1 h-4 w-4" /> Comentar
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-shrink-0 px-2 py-1 text-xs text-zinc-400 hover:text-green-400">
                      <Share2 className="mr-1 h-4 w-4" /> Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 w-[90%] sm:max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-4 pb-4">
            <div>
              <Label htmlFor="name" className="text-zinc-200">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label htmlFor="biografia" className="text-zinc-200">Biografia</Label>
              <Textarea id="biografia" value={biografia} onChange={(e) => setBiografia(e.target.value)} rows={3} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label htmlFor="fotoPerfil" className="text-zinc-200">URL da Foto de Perfil</Label>
              <Input id="fotoPerfil" value={fotoPerfil} onChange={(e) => setFotoPerfil(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditProfileOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Cancelar
              </Button>
              <Button onClick={handleUpdateProfile} className="bg-blue-600 hover:bg-blue-700 text-white">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
