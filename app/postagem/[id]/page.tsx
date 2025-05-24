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
import { ArrowLeft, MoreHorizontal, Heart, MessageCircle, Share2, Send, User } from "lucide-react"
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

interface Comment {
  id: number
  conteudo: string
  data_criacao: string
  usuario: {
    id: number
    name: string
    email: string
    fotoPerfil?: string
    biografia?: string
  }
}

export default function PostagemPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null
  const isLoggedIn = typeof window !== "undefined" ? localStorage.getItem("logado") === "true" : false

  const [currentUser, setCurrentUser] = useState<{
    id: number
    name: string
    email: string
    fotoPerfil?: string
    biografia?: string
  } | null>(null)
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [tags, setTags] = useState("")
  const [foto, setFoto] = useState("")

  useEffect(() => {
    if (!postId) return

    // Verificar se há dados mock
    const mockUser = localStorage.getItem("mock_user")
    const mockPosts = localStorage.getItem("mock_posts")

    if (mockUser) {
      setCurrentUser(JSON.parse(mockUser))
    }

    if (mockPosts) {
      const posts = JSON.parse(mockPosts)
      const foundPost = posts.find((p: Post) => p.id === Number.parseInt(postId))
      if (foundPost) {
        setPost(foundPost)
        setLikesCount(foundPost.likesCount || 0)
        setTitulo(foundPost.titulo)
        setConteudo(foundPost.conteudo)
        setTags(foundPost.tags)
        setFoto(foundPost.foto || "")
        return
      }
    }

    // Buscar dados do usuário logado
    if (userId) {
      fetch(`http://localhost:3001/users/${userId}`)
        .then((res) => res.json())
        .then((data) => setCurrentUser(data))
        .catch((err) => console.error("Erro ao buscar usuário:", err))
    }

    // Buscar dados da postagem
    fetch(`http://localhost:3001/postagens/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data)
        setLikesCount(data.likesCount || 0)
        setTitulo(data.titulo)
        setConteudo(data.conteudo)
        setTags(data.tags)
        setFoto(data.foto || "")
      })
      .catch((err) => console.error("Erro ao buscar postagem:", err))

    // Buscar comentários
    fetch(`http://localhost:3001/comentarios/${postId}`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error("Erro ao buscar comentários:", err))

    // Verificar se o usuário curtiu a postagem
    if (userId) {
      fetch(`http://localhost:3001/likes/${postId}`)
        .then((res) => res.json())
        .then((data) => {
          const hasLiked = data.some(
            (like: any) => like.postagem.id === Number.parseInt(postId) && like.usuario.id === Number.parseInt(userId),
          )
          setLiked(hasLiked)
        })
        .catch((err) => console.error("Erro ao verificar curtidas:", err))
    }
  }, [postId, userId])

  const handleLike = async () => {
    if (!userId) return

    const newLikesCount = liked ? likesCount - 1 : likesCount + 1
    setLikesCount(newLikesCount)
    setLiked(!liked)

    try {
      await fetch(`http://localhost:3001/likes/${postId}/${userId}`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Erro ao curtir/descurtir:", error)
      setLiked(liked)
      setLikesCount(likesCount)
    }
  }

  const handleCreateComment = async () => {
    if (!newComment.trim() || !userId || !currentUser) return

    const mockComment = {
      id: Date.now(),
      conteudo: newComment,
      data_criacao: new Date().toISOString(),
      usuario: currentUser,
    }

    setComments([...comments, mockComment])
    setNewComment("")

    try {
      const response = await fetch("http://localhost:3001/comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo: newComment,
          usuarioId: userId,
          postagemId: postId,
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(comments.filter((c) => c.id !== mockComment.id).concat(comment))
      }
    } catch (error) {
      console.error("Erro ao criar comentário:", error)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      setComments(comments.filter((comment) => comment.id !== commentId))

      await fetch(`http://localhost:3001/comentarios/${commentId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Erro ao deletar comentário:", error)
    }
  }

  const handleUpdatePost = async () => {
    try {
      // Modo mock
      const mockPosts = localStorage.getItem("mock_posts")
      if (mockPosts && post) {
        const posts = JSON.parse(mockPosts)
        const updatedPosts = posts.map((p: Post) => (p.id === post.id ? { ...p, titulo, conteudo, tags, foto } : p))
        localStorage.setItem("mock_posts", JSON.stringify(updatedPosts))
        setPost({ ...post, titulo, conteudo, tags, foto })
        setIsEditModalOpen(false)
        return
      }

      const response = await fetch(`http://localhost:3001/postagens/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, conteudo, tags, foto, usuarioId: userId }),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        setIsEditModalOpen(false)
      }
    } catch (error) {
      console.error("Erro ao atualizar postagem:", error)
    }
  }

  const handleDeletePost = async () => {
    try {
      // Modo mock
      const mockPosts = localStorage.getItem("mock_posts")
      if (mockPosts) {
        const posts = JSON.parse(mockPosts)
        const updatedPosts = posts.filter((p: Post) => p.id !== Number.parseInt(postId))
        localStorage.setItem("mock_posts", JSON.stringify(updatedPosts))
        router.push("/home")
        return
      }

      await fetch(`http://localhost:3001/postagens/${postId}`, {
        method: "DELETE",
      })
      router.push("/home")
    } catch (error) {
      console.error("Erro ao deletar postagem:", error)
    }
  }

  const handleShare = () => {
    const shareData = {
      title: post?.titulo,
      url: `${window.location.origin}/postagem/${postId}`,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      navigator.clipboard.writeText(shareData.url)
      alert("Link copiado para a área de transferência!")
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white">Carregando postagem...</p>
      </div>
    )
  }

  const isOwnPost = currentUser?.id === post.usuario.id

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-zinc-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white">Postagem</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Post */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="cursor-pointer" onClick={() => router.push(`/perfil/${post.usuario.id}`)}>
                    <AvatarImage src={post.usuario.fotoPerfil || "/placeholder.svg"} alt={post.usuario.name} />
                    <AvatarFallback className="bg-zinc-700">
                      <User className="h-4 w-4 text-zinc-300" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p
                      className="font-semibold text-blue-400 cursor-pointer hover:text-blue-300 hover:underline"
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
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-800 border-zinc-700">
                    {isOwnPost ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => setIsEditModalOpen(true)}
                          className="text-zinc-200 hover:bg-zinc-700"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeletePost} className="text-red-400 hover:bg-zinc-700">
                          Excluir
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700">Denunciar</DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/postagem/${postId}`)
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

            <CardContent>
              <CardTitle className="mb-3 text-2xl text-white">{post.titulo}</CardTitle>
              <p className="text-zinc-300 mb-4">{post.conteudo}</p>

              {post.foto && (
                <img
                  src={post.foto || "/placeholder.svg"}
                  alt="Post image"
                  className="w-full rounded-lg mb-4 max-h-96 object-cover"
                />
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.split(",").map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-zinc-400 border-t border-zinc-800 pt-4">
                {isLoggedIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`${liked ? "text-red-400" : "text-zinc-400"} hover:text-red-400`}
                  >
                    <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-current" : ""}`} />
                    {likesCount}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-blue-400">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {comments.length}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} className="text-zinc-400 hover:text-green-400">
                  <Share2 className="mr-1 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Comentários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              {isLoggedIn && (
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={currentUser?.fotoPerfil || "/placeholder.svg"} alt={currentUser?.name} />
                    <AvatarFallback className="bg-zinc-700">
                      <User className="h-4 w-4 text-zinc-300" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleCreateComment}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {comments.length === 0 ? (
                <p className="text-zinc-400 text-center py-4">Nenhum comentário ainda</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-zinc-800/50 rounded-lg">
                    <Avatar className="cursor-pointer" onClick={() => router.push(`/perfil/${comment.usuario.id}`)}>
                      <AvatarImage src={comment.usuario.fotoPerfil || "/placeholder.svg"} alt={comment.usuario.name} />
                      <AvatarFallback className="bg-zinc-700">
                        <User className="h-4 w-4 text-zinc-300" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="font-semibold text-blue-400 cursor-pointer hover:text-blue-300 hover:underline"
                          onClick={() => router.push(`/perfil/${comment.usuario.id}`)}
                        >
                          {comment.usuario.name}
                        </p>
                      </div>
                      <p className="text-zinc-300">{comment.conteudo}</p>

                      {currentUser?.id === comment.usuario.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-400 hover:text-red-300 mt-2"
                        >
                          Apagar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Post Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Postagem</DialogTitle>
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
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
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
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
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
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
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
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdatePost} className="bg-blue-600 hover:bg-blue-700 text-white">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
