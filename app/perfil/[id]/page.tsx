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

    // Verificar se há dados mock
    const mockUser = localStorage.getItem("mock_user")
    const mockPosts = localStorage.getItem("mock_posts")

    if (mockUser && profileId === "1") {
      const user = JSON.parse(mockUser)
      setCurrentUser(user)
      setProfileUser(user)
      setName(user.name)
      setBiografia(user.biografia || "")
      setFotoPerfil(user.fotoPerfil || "")

      if (mockPosts) {
        const allPosts = JSON.parse(mockPosts)
        const userPosts = allPosts.filter((post: Post) => post.usuario.id === Number.parseInt(profileId))
        setPosts(userPosts)
      }
      return
    }

    // Buscar dados do usuário logado
    fetch(`http://localhost:3001/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setCurrentUser(data))
      .catch((err) => console.error("Erro ao buscar usuário logado:", err))

    // Buscar dados do perfil visitado
    fetch(`http://localhost:3001/users/${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfileUser(data)
        setName(data.name)
        setBiografia(data.biografia || "")
        setFotoPerfil(data.fotoPerfil || "")
      })
      .catch((err) => console.error("Erro ao buscar perfil:", err))

    // Buscar postagens do usuário
    fetch(`http://localhost:3001/postagens/usuario/${profileId}`)
      .then((res) => res.json())
      .then((data) => {
        const sortedPosts = data.sort(
          (a: Post, b: Post) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime(),
        )
        setPosts(sortedPosts)
      })
      .catch((err) => console.error("Erro ao buscar postagens:", err))
  }, [profileId, userId, router])

  const handleUpdateProfile = async () => {
    try {
      // Modo mock
      const mockUser = localStorage.getItem("mock_user")
      if (mockUser) {
        const updatedUser = { ...JSON.parse(mockUser), name, biografia, fotoPerfil }
        localStorage.setItem("mock_user", JSON.stringify(updatedUser))
        setProfileUser(updatedUser)
        setCurrentUser(updatedUser)
        setIsEditProfileOpen(false)
        return
      }

      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, biografia, fotoPerfil }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setProfileUser(updatedUser)
        setIsEditProfileOpen(false)
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
    }
  }

  const handleDeletePost = async (postId: number) => {
    try {
      // Modo mock
      const mockPosts = localStorage.getItem("mock_posts")
      if (mockPosts) {
        const allPosts = JSON.parse(mockPosts)
        const updatedPosts = allPosts.filter((post: Post) => post.id !== postId)
        localStorage.setItem("mock_posts", JSON.stringify(updatedPosts))
        setPosts(posts.filter((post) => post.id !== postId))
        return
      }

      await fetch(`http://localhost:3001/postagens/${postId}`, { method: "DELETE" })
      setPosts(posts.filter((post) => post.id !== postId))
    } catch (error) {
      console.error("Erro ao deletar postagem:", error)
    }
  }

  const isOwnProfile = currentUser?.id === profileUser?.id

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-zinc-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white">Perfil</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src={profileUser?.fotoPerfil || "/placeholder.svg"} alt={profileUser?.name} />
                <AvatarFallback className="text-2xl bg-zinc-700">
                  <User className="h-16 w-16 text-zinc-300" />
                </AvatarFallback>
              </Avatar>

              <h2 className="text-3xl font-bold mb-2 text-white">{profileUser?.name}</h2>

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

        {/* Posts */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl font-bold text-center mb-6 text-white">Postagens</h3>

          {posts.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-8 text-center">
                <p className="text-zinc-400">Nenhuma postagem encontrada</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.usuario.fotoPerfil || "/placeholder.svg"} alt={post.usuario.name} />
                        <AvatarFallback className="bg-zinc-700">
                          <User className="h-4 w-4 text-zinc-300" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-blue-400">{post.usuario.name}</p>
                        <p className="text-sm text-zinc-400">
                          {formatDistanceToNow(new Date(post.data_criacao), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-800 border-zinc-700">
                        {isOwnProfile ? (
                          <>
                            <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700">Editar</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-400 hover:bg-zinc-700"
                            >
                              Excluir
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700">Denunciar</DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/postagem/${post.id}`)
                            alert("Link copiado!")
                          }}
                          className="text-zinc-200 hover:bg-zinc-700"
                        >
                          Copiar Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="cursor-pointer" onClick={() => router.push(`/postagem/${post.id}`)}>
                  <CardTitle className="mb-3 text-xl text-white">{post.titulo}</CardTitle>
                  <p className="text-zinc-300 mb-4">{post.conteudo}</p>

                  {post.foto && (
                    <img
                      src={post.foto || "/placeholder.svg"}
                      alt="Post image"
                      className="w-full rounded-lg mb-4 max-h-96 object-cover"
                    />
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.split(",").map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-zinc-400">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400">
                      <Heart className="mr-1 h-4 w-4" />
                      {post.likesCount || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-blue-400">
                      <MessageCircle className="mr-1 h-4 w-4" />
                      Comentar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-green-400">
                      <Share2 className="mr-1 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Perfil</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-zinc-200">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div>
              <Label htmlFor="biografia" className="text-zinc-200">
                Biografia
              </Label>
              <Textarea
                id="biografia"
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div>
              <Label htmlFor="fotoPerfil" className="text-zinc-200">
                URL da Foto de Perfil
              </Label>
              <Input
                id="fotoPerfil"
                value={fotoPerfil}
                onChange={(e) => setFotoPerfil(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditProfileOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
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
