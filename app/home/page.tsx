"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Heart, MessageCircle, Share2, Search, User, LogOut, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Post {
  id: number
  titulo: string
  conteudo: string
  tags: string
  foto?: string
  data_criacao: string
  usuario: {
    id: number
    name: string
    email: string
    fotoPerfil?: string
    biografia?: string
  }
  likesCount?: number
}

export default function HomePage() {
  const [user, setUser] = useState<{
    id: number
    name: string
    email: string
    fotoPerfil?: string
    biografia?: string
  } | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [tags, setTags] = useState("")
  const [foto, setFoto] = useState("")
  const [editingPost, setEditingPost] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const router = useRouter()

  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null

  useEffect(() => {
    if (!userId) {
      router.push("/")
      return
    }

    const loadData = async () => {
      setLoading(true)

      // Verificar se há dados mock
      const mockUser = localStorage.getItem("mock_user")
      const mockPosts = localStorage.getItem("mock_posts")

      if (mockUser) {
        setUser(JSON.parse(mockUser))
      }

      if (mockPosts) {
        // Simular delay de carregamento
        await new Promise((resolve) => setTimeout(resolve, 800))
        setPosts(JSON.parse(mockPosts))
        setLoading(false)
        return
      }

      try {
        // Buscar dados do usuário
        const userResponse = await fetch(`http://localhost:3001/users/${userId}`)
        const userData = await userResponse.json()
        setUser(userData)

        // Buscar postagens
        const postsResponse = await fetch("http://localhost:3001/postagens")
        const postsData = await postsResponse.json()
        const sortedPosts = postsData.sort(
          (a: Post, b: Post) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime(),
        )
        setPosts(sortedPosts)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, router])

  const handleCreateOrUpdatePost = async () => {
    setCreating(true)
    const postData = { titulo, conteudo, tags, usuarioId: userId, foto }

    try {
      if (editingPost) {
        // Modo mock - atualizar no localStorage
        const mockPosts = localStorage.getItem("mock_posts")
        if (mockPosts) {
          const posts = JSON.parse(mockPosts)
          const updatedPosts = posts.map((post: Post) =>
            post.id === editingPost ? { ...post, titulo, conteudo, tags, foto } : post,
          )
          localStorage.setItem("mock_posts", JSON.stringify(updatedPosts))
          setPosts(updatedPosts)
          setIsModalOpen(false)
          resetForm()
          return
        }

        const response = await fetch(`http://localhost:3001/postagens/${editingPost}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        })
        const updatedPost = await response.json()
        setPosts(posts.map((post) => (post.id === editingPost ? updatedPost : post)))
      } else {
        // Modo mock - criar novo post
        const mockPosts = localStorage.getItem("mock_posts")
        if (mockPosts && user) {
          const posts = JSON.parse(mockPosts)
          const newPost = {
            id: Date.now(),
            titulo,
            conteudo,
            tags,
            foto,
            data_criacao: new Date().toISOString(),
            usuario: user,
            likesCount: 0,
          }
          const updatedPosts = [newPost, ...posts]
          localStorage.setItem("mock_posts", JSON.stringify(updatedPosts))
          setPosts(updatedPosts)
          setIsModalOpen(false)
          resetForm()
          return
        }

        const response = await fetch("http://localhost:3001/postagens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        })
        const newPost = await response.json()
        setPosts([newPost, ...posts])
      }

      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar postagem:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePost = async (postId: number) => {
    try {
      // Modo mock - deletar do localStorage
      const mockPosts = localStorage.getItem("mock_posts")
      if (mockPosts) {
        const posts = JSON.parse(mockPosts)
        const updatedPosts = posts.filter((post: Post) => post.id !== postId)
        localStorage.setItem("mock_posts", JSON.stringify(updatedPosts))
        setPosts(updatedPosts)
        return
      }

      await fetch(`http://localhost:3001/postagens/${postId}`, { method: "DELETE" })
      setPosts(posts.filter((post) => post.id !== postId))
    } catch (error) {
      console.error("Erro ao deletar postagem:", error)
    }
  }

  const handleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts)
    const isLiked = likedPosts.has(postId)

    if (isLiked) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }

    setLikedPosts(newLikedPosts)

    // Atualizar contagem de likes
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, likesCount: (post.likesCount || 0) + (isLiked ? -1 : 1) } : post,
      ),
    )
  }

  const resetForm = () => {
    setTitulo("")
    setConteudo("")
    setTags("")
    setFoto("")
    setEditingPost(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (post: Post) => {
    setTitulo(post.titulo)
    setConteudo(post.conteudo)
    setTags(post.tags)
    setFoto(post.foto || "")
    setEditingPost(post.id)
    setIsModalOpen(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_id")
    localStorage.removeItem("logado")
    localStorage.removeItem("mock_user")
    localStorage.removeItem("mock_posts")
    router.push("/")
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="skeleton h-8 w-32"></div>
            <div className="flex items-center gap-4">
              <div className="skeleton h-10 w-64"></div>
              <div className="skeleton h-8 w-8 rounded-full"></div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="skeleton h-16 w-full rounded-lg"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-64 w-full rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 animate-fade-in">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-40 animate-slide-in">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white hover-scale cursor-pointer">PingMe </h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors-smooth" />
              <Input
                placeholder="Buscar postagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover-scale">
                  <Avatar className="h-8 w-8 transition-transform-smooth">
                    <AvatarImage src={user?.fotoPerfil || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback className="bg-zinc-700">
                      <User className="h-4 w-4 text-zinc-300" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-800 border-zinc-700 animate-scale-in" align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/perfil/${userId}`)}
                  className="text-zinc-200 hover:bg-zinc-700 transition-colors-smooth"
                >
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-zinc-200 hover:bg-zinc-700 transition-colors-smooth"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Botão de Criar Post */}
          <Card className="bg-zinc-900 border-zinc-800 hover-lift animate-slide-in">
            <CardContent className="p-4 flex items-center gap-2">
              <Avatar
                className="cursor-pointer hover-scale transition-transform-smooth"
              >
                <AvatarImage src={user?.fotoPerfil || "/placeholder.svg"} alt={user?.fotoPerfil} />
                <AvatarFallback className="bg-zinc-700">
                  <User className="h-4 w-4 text-zinc-300" />
                </AvatarFallback>
              </Avatar>
              <Button
                onClick={openCreateModal}
                className="w-full bg-blue-800 hover:bg-blue-700 text-white btn-animate transition-all-smooth rounded-3xl"
              >
                <Plus className="mr-2 h-4 w-4 transition-transform-smooth group-hover:rotate-90" />
                Criar nova postagem
              </Button>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {filteredPosts.map((post, index) => (
            <Card
              key={post.id}
              className={`bg-zinc-900 border-zinc-800 hover-lift transition-all-smooth stagger-item`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="cursor-pointer hover-scale transition-transform-smooth"
                      onClick={() => router.push(`/perfil/${post.usuario.id}`)}
                    >
                      <AvatarImage src={post.usuario.fotoPerfil || "/placeholder.svg"} alt={post.usuario.name} />
                      <AvatarFallback className="bg-zinc-700">
                        <User className="h-4 w-4 text-zinc-300" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p
                        className="font-semibold text-blue-400 cursor-pointer hover:text-blue-300 hover:underline transition-colors-smooth"
                        onClick={() => router.push(`/perfil/${post.usuario.id}`)}
                      >
                        {post.usuario.name}
                      </p>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-200 transition-colors-smooth hover-scale"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-zinc-800 border-zinc-700 animate-scale-in">
                      {post.usuario.id === Number.parseInt(userId || "0") ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => openEditModal(post)}
                            className="text-zinc-200 hover:bg-zinc-700 transition-colors-smooth"
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-400 hover:bg-zinc-700 transition-colors-smooth"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700 transition-colors-smooth">
                          Denunciar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/postagem/${post.id}`)
                          alert("Link copiado!")
                        }}
                        className="text-zinc-200 hover:bg-zinc-700 transition-colors-smooth"
                      >
                        Copiar Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent
                className="cursor-pointer transition-all-smooth"
                onClick={() => router.push(`/postagem/${post.id}`)}
              >
                <CardTitle className="mb-3 text-xl text-white hover:text-blue-300 transition-colors-smooth">
                  {post.titulo}
                </CardTitle>
                <p className="text-zinc-300 mb-4">{post.conteudo}</p>

                {post.foto && (
                  <img
                    src={post.foto || "/placeholder.svg"}
                    alt="Post image"
                    className="w-full rounded-lg mb-4 max-h-96 object-cover hover-scale transition-transform-smooth"
                  />
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.split(",").map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors-smooth hover-scale"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-zinc-400">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(post.id)
                    }}
                    className={`${likedPosts.has(post.id) ? "text-red-400" : "text-zinc-400"} hover:text-red-400 transition-all-smooth hover-scale`}
                  >
                    <Heart
                      className={`mr-1 h-4 w-4 transition-all-smooth ${likedPosts.has(post.id) ? "fill-current animate-bounce-custom" : ""}`}
                    />
                    {post.likesCount || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-blue-400 transition-colors-smooth hover-scale"
                  >
                    <MessageCircle className="mr-1 h-4 w-4 transition-transform-smooth" />
                    Comentar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-green-400 transition-colors-smooth hover-scale"
                  >
                    <Share2 className="mr-1 h-4 w-4 transition-transform-smooth" />
                    Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de Criação Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 modal-content">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPost ? "Editar Postagem" : "Criar Nova Postagem"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo" className="text-zinc-200">
                Título
              </Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="conteudo" className="text-zinc-200">
                Conteúdo
              </Label>
              <Textarea
                id="conteudo"
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={4}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="tags" className="text-zinc-200">
                Tags (separadas por vírgula)
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="foto" className="text-zinc-200">
                URL da Imagem
              </Label>
              <Input
                id="foto"
                value={foto}
                onChange={(e) => setFoto(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 transition-all-smooth focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all-smooth"
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateOrUpdatePost}
                className="bg-blue-600 hover:bg-blue-700 text-white btn-animate transition-all-smooth"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingPost ? "Salvando..." : "Criando..."}
                  </>
                ) : editingPost ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Postagem"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
