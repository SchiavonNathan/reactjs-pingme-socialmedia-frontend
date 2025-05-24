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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Heart,
  Share2,
  Search,
  User,
  LogOut,
  Loader2,
} from "lucide-react"
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
  const [user, setUser] = useState<null | { id: number; name: string; email: string; fotoPerfil?: string; biografia?: string }>(null)
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
      const mockUser = localStorage.getItem("mock_user")
      const mockPosts = localStorage.getItem("mock_posts")
      if (mockUser) setUser(JSON.parse(mockUser))
      if (mockPosts) {
        await new Promise((r) => setTimeout(r, 800))
        setPosts(JSON.parse(mockPosts))
        setLoading(false)
        return
      }
      try {
        const u = await fetch(`http://localhost:3001/users/${userId}`).then((r) => r.json())
        setUser(u)
        const data = await fetch("http://localhost:3001/postagens").then((r) => r.json())
        setPosts(data.sort((a: Post, b: Post) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [userId, router])

  const closeModal = () => {
    setIsModalOpen(false)
    setTitulo("")
    setConteudo("")
    setTags("")
    setFoto("")
    setEditingPost(null)
  }

  const handleCreateOrUpdatePost = async () => {
    setCreating(true)
    const body = { titulo, conteudo, tags, usuarioId: userId, foto }
    try {
      if (editingPost) {
        const mock = localStorage.getItem("mock_posts")
        if (mock) {
          const arr = JSON.parse(mock)
          const upd = arr.map((p: Post) => p.id === editingPost ? { ...p, titulo, conteudo, tags, foto } : p)
          localStorage.setItem("mock_posts", JSON.stringify(upd))
          setPosts(upd)
          closeModal()
          return
        }
        const upd = await fetch(`http://localhost:3001/postagens/${editingPost}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then((r) => r.json())
        setPosts(posts.map((p) => p.id === editingPost ? upd : p))
      } else {
        const mock = localStorage.getItem("mock_posts")
        if (mock && user) {
          const arr = JSON.parse(mock)
          const novo: Post = {
            id: Date.now(),
            titulo,
            conteudo,
            tags,
            foto,
            data_criacao: new Date().toISOString(),
            usuario: user,
            likesCount: 0,
          }
          const upd = [novo, ...arr]
          localStorage.setItem("mock_posts", JSON.stringify(upd))
          setPosts(upd)
          closeModal()
          return
        }
        const novo = await fetch("http://localhost:3001/postagens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then((r) => r.json())
        setPosts([novo, ...posts])
      }
      closeModal()
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePost = async (id: number) => {
    try {
      const mock = localStorage.getItem("mock_posts")
      if (mock) {
        const upd = JSON.parse(mock).filter((p: Post) => p.id !== id)
        localStorage.setItem("mock_posts", JSON.stringify(upd))
        setPosts(upd)
        return
      }
      await fetch(`http://localhost:3001/postagens/${id}`, { method: "DELETE" })
      setPosts(posts.filter((p) => p.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const handleLike = (id: number) => {
    const l = new Set(likedPosts)
    const liked = l.has(id)
    liked ? l.delete(id) : l.add(id)
    setLikedPosts(l)
    setPosts(posts.map((p) => p.id === id ? { ...p, likesCount: (p.likesCount||0) + (liked ? -1 : 1) } : p))
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  const filtered = posts.filter((p) =>
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tags.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
        <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="skeleton h-8 w-32" />
            <div className="flex items-center gap-4">
              <div className="skeleton h-10 w-48 sm:w-64" />
              <div className="skeleton h-8 w-8 rounded-full" />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="skeleton h-16 w-full rounded-lg" />
            {[1,2,3].map(i=>(
              <div key={i} className="skeleton h-60 sm:h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
              <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center justify-between w-full sm:w-auto">
                <h1 className="text-3xl font-bold text-white cursor-pointer">PingMe</h1>
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.fotoPerfil || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback className="bg-zinc-700">
                            <User className="h-4 w-4 text-zinc-300" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-zinc-800 border-zinc-700 z-50" align="end">
                      <DropdownMenuItem onClick={() => router.push(`/perfil/${userId}`)} className="text-zinc-200 hover:bg-zinc-700">
                        <User className="mr-2 h-4 w-4" /> Meu Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-zinc-200 hover:bg-zinc-700">
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center w-full sm:w-auto gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Buscar postagens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="hidden sm:flex">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.fotoPerfil || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback className="bg-zinc-700">
                            <User className="h-4 w-4 text-zinc-300" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-zinc-800 border-zinc-700 z-50" align="end">
                      <DropdownMenuItem onClick={() => router.push(`/perfil/${userId}`)} className="text-zinc-200 hover:bg-zinc-700">
                        <User className="mr-2 h-4 w-4" /> Meu Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-zinc-200 hover:bg-zinc-700">
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

            </div>
          </header>


      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <Button onClick={()=>setIsModalOpen(true)} className="flex-1 bg-blue-800 hover:bg-blue-700 text-white rounded-3xl">
                <Plus className="mr-2 h-4 w-4"/> Criar nova postagem
              </Button>
            </CardContent>
          </Card>

          {filtered.map((post, i) => (
            <Card key={post.id} className="bg-zinc-900 border-zinc-800 hover-lift" style={{animationDelay:`${i*0.1}s`}}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 cursor-pointer" onClick={()=>router.push(`/perfil/${post.usuario.id}`)}>
                      <AvatarImage src={post.usuario.fotoPerfil||"/placeholder.svg"} />
                      <AvatarFallback className="bg-zinc-700">
                        <User className="h-4 w-4 text-zinc-300"/>
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p onClick={()=>router.push(`/perfil/${post.usuario.id}`)} className="font-semibold text-blue-400 hover:underline cursor-pointer">
                        {post.usuario.name}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {formatDistanceToNow(new Date(post.data_criacao),{addSuffix:true,locale:ptBR})}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="self-end sm:self-auto text-zinc-400 hover:text-zinc-200">
                        <MoreHorizontal className="h-4 w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-zinc-800 border-zinc-700">
                      {post.usuario.id===Number(userId) ? (
                        <>
                          <DropdownMenuItem onClick={()=>{setEditingPost(post.id); setTitulo(post.titulo); setConteudo(post.conteudo); setTags(post.tags); setFoto(post.foto||""); setIsModalOpen(true)}} className="text-zinc-200 hover:bg-zinc-700">
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={()=>handleDeletePost(post.id)} className="text-red-400 hover:bg-zinc-700">
                            Excluir
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem className="text-zinc-200 hover:bg-zinc-700">Denunciar</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/postagem/${post.id}`); alert("Link copiado!")}} className="text-zinc-200 hover:bg-zinc-700">
                        Copiar Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent onClick={()=>router.push(`/postagem/${post.id}`)} className="cursor-pointer">
                <CardTitle className="mb-3 text-lg sm:text-xl text-white hover:text-blue-300">{post.titulo}</CardTitle>
                <p className="text-zinc-300 mb-4">{post.conteudo}</p>
                {post.foto && (
                  <img src={post.foto} alt="Post" className="w-full rounded-lg mb-4 max-h-52 sm:max-h-96 object-cover"/>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.split(",").map((t) => (
                    <Badge key={t} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">{t.trim()}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-zinc-400">
                  <Button variant="ghost" size="sm" onClick={(e)=>{e.stopPropagation(); handleLike(post.id)}} className={`${likedPosts.has(post.id) ? "text-red-400" : ""} hover:text-red-400`}>
                    <Heart className="mr-1 h-4 w-4" /> {post.likesCount||0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-green-400 px-2 py-1 text-sm">
                    <Share2 className="mr-1 h-4 w-4"/> Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 w-[90%] sm:max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPost ? "Editar Postagem" : "Criar Nova Postagem"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo" className="text-zinc-200">Título</Label>
              <Input id="titulo" value={titulo} onChange={(e)=>setTitulo(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white"/>
            </div>
            <div>
              <Label htmlFor="conteudo" className="text-zinc-200">Conteúdo</Label>
              <Textarea id="conteudo" value={conteudo} onChange={(e)=>setConteudo(e.target.value)} rows={4} className="bg-zinc-800 border-zinc-700 text-white"/>
            </div>
            <div>
              <Label htmlFor="tags" className="text-zinc-200">Tags</Label>
              <Input id="tags" value={tags} onChange={(e)=>setTags(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white"/>
            </div>
            <div>
              <Label htmlFor="foto" className="text-zinc-200">URL da Imagem</Label>
              <Input id="foto" value={foto} onChange={(e)=>setFoto(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white"/>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal} disabled={creating} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Cancelar
              </Button>
              <Button onClick={handleCreateOrUpdatePost} disabled={creating} className="bg-blue-600 hover:bg-blue-700 text-white">
                {creating
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{editingPost ? "Salvando..." : "Criando..."}</>
                  : editingPost ? "Salvar Alterações" : "Criar Postagem"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
