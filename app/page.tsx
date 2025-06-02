"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Users,
  Gift,
  Clock,
  Trophy,
  Download,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react"
import * as XLSX from "xlsx"

interface Participant {
  name: string
  email?: string
  phone?: string
}

interface Prize {
  id: string
  name: string
  winnerCount: number
  backupCount: number
}

interface Winner {
  participant: Participant
  prize: Prize
  isBackup: boolean
}

type Step = "participants" | "prizes" | "settings" | "draw" | "results"

export default function CekilisApp() {
  const [currentStep, setCurrentStep] = useState<Step>("participants")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [countdown, setCountdown] = useState<number>(10)
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false)
  const [winners, setWinners] = useState<Winner[]>([])
  const [showResults, setShowResults] = useState<boolean>(false)
  const [confetti, setConfetti] = useState<boolean>(false)
  const [newPrizeName, setNewPrizeName] = useState<string>("")
  const [newPrizeWinners, setNewPrizeWinners] = useState<number>(1)
  const [newPrizeBackups, setNewPrizeBackups] = useState<number>(2)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const steps: { key: Step; title: string; description: string }[] = [
    { key: "participants", title: "Katılımcılar", description: "Excel dosyasından katılımcıları yükleyin" },
    { key: "prizes", title: "Hediyeler", description: "Hediyeleri tek tek ekleyin" },
    { key: "settings", title: "Ayarlar", description: "Çekiliş ayarlarını kontrol edin" },
    { key: "draw", title: "Çekiliş", description: "Çekilişi başlatın" },
    { key: "results", title: "Sonuçlar", description: "Kazananları görüntüleyin" },
  ]

  const getCurrentStepIndex = () => steps.findIndex((step) => step.key === currentStep)
  const getProgress = () => ((getCurrentStepIndex() + 1) / steps.length) * 100

  // Konfeti animasyonu
  useEffect(() => {
    if (confetti && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const particles: any[] = []
      const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd", "#98d8c8"]

      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          vx: Math.random() * 6 - 3,
          vy: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
        })
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        particles.forEach((particle, index) => {
          particle.x += particle.vx
          particle.y += particle.vy
          particle.vy += 0.1

          ctx.fillStyle = particle.color
          ctx.fillRect(particle.x, particle.y, particle.size, particle.size)

          if (particle.y > canvas.height) {
            particles.splice(index, 1)
          }
        })

        if (particles.length > 0) {
          requestAnimationFrame(animate)
        } else {
          setConfetti(false)
        }
      }

      animate()
    }
  }, [confetti])

  // Geri sayım
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCountdownActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setIsCountdownActive(false)
      drawWinners()
    }
    return () => clearInterval(interval)
  }, [isCountdownActive, countdown])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const participantList: Participant[] = jsonData
          .map((row: any) => ({
            name: row.Ad || row.Name || row.İsim || (Object.values(row)[0] as string),
            email: row.Email || row.Eposta || "",
            phone: row.Telefon || row.Phone || "",
          }))
          .filter((p) => p.name)

        setParticipants(participantList)
      } catch (error) {
        alert("Excel dosyası okunurken hata oluştu. Lütfen geçerli bir Excel dosyası seçin.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const addPrize = () => {
    if (!newPrizeName.trim()) {
      alert("Lütfen hediye adını girin!")
      return
    }

    const newPrize: Prize = {
      id: Date.now().toString(),
      name: newPrizeName.trim(),
      winnerCount: newPrizeWinners,
      backupCount: newPrizeBackups,
    }

    setPrizes([...prizes, newPrize])
    setNewPrizeName("")
    setNewPrizeWinners(1)
    setNewPrizeBackups(2)
  }

  const removePrize = (id: string) => {
    setPrizes(prizes.filter((prize) => prize.id !== id))
  }

  const updatePrize = (id: string, field: keyof Prize, value: string | number) => {
    setPrizes(prizes.map((prize) => (prize.id === id ? { ...prize, [field]: value } : prize)))
  }

  const startCountdown = () => {
    setCountdown(10)
    setIsCountdownActive(true)
    setShowResults(false)
    setWinners([])
  }

  const drawWinners = () => {
    const allWinners: Winner[] = []
    const availableParticipants = [...participants]

    prizes.forEach((prize) => {
      const prizeWinners: Winner[] = []

      // Ana kazananlar
      for (let i = 0; i < prize.winnerCount && availableParticipants.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableParticipants.length)
        const winner = availableParticipants.splice(randomIndex, 1)[0]
        prizeWinners.push({
          participant: winner,
          prize,
          isBackup: false,
        })
      }

      // Yedekler
      for (let i = 0; i < prize.backupCount && availableParticipants.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableParticipants.length)
        const backup = availableParticipants.splice(randomIndex, 1)[0]
        prizeWinners.push({
          participant: backup,
          prize,
          isBackup: true,
        })
      }

      allWinners.push(...prizeWinners)
    })

    setWinners(allWinners)
    setShowResults(true)
    setConfetti(true)
    setCurrentStep("results")
  }

  const exportResults = () => {
    const ws = XLSX.utils.json_to_sheet(
      winners.map((winner) => ({
        Hediye: winner.prize.name,
        Kazanan: winner.participant.name,
        Email: winner.participant.email || "",
        Telefon: winner.participant.phone || "",
        Durum: winner.isBackup ? "Yedek" : "Ana Kazanan",
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Kazananlar")

    // Create blob and download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "cekilis-sonuclari.xlsx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const canGoNext = () => {
    switch (currentStep) {
      case "participants":
        return participants.length > 0
      case "prizes":
        return prizes.length > 0
      case "settings":
        return true
      case "draw":
        return false
      case "results":
        return false
      default:
        return false
    }
  }

  const canGoPrev = () => {
    return currentStep !== "participants" && currentStep !== "results"
  }

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key)
    }
  }

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key)
    }
  }

  const resetApp = () => {
    setCurrentStep("participants")
    setParticipants([])
    setPrizes([])
    setWinners([])
    setShowResults(false)
    setConfetti(false)
    setIsCountdownActive(false)
    setCountdown(10)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none z-50 ${confetti ? "block" : "hidden"}`} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎉 Çekiliş Uygulaması</h1>
          <p className="text-gray-600">Adım adım çekiliş düzenleyin</p>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Adım {getCurrentStepIndex() + 1} / {steps.length}
                </span>
                <span>{Math.round(getProgress())}% Tamamlandı</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <div
                    key={step.key}
                    className={`text-center ${index <= getCurrentStepIndex() ? "text-purple-600" : "text-gray-400"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-sm font-medium ${
                        index <= getCurrentStepIndex() ? "bg-purple-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="text-xs">{step.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === "participants" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Katılımcı Listesi Yükleme
              </CardTitle>
              <CardDescription>Excel dosyasından katılımcıları yükleyin (Ad, Email, Telefon sütunları)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
              {participants.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">{participants.length} katılımcı yüklendi</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {participants.slice(0, 10).map((participant, index) => (
                      <div key={index} className="text-sm py-1">
                        {participant.name} {participant.email && `(${participant.email})`}
                      </div>
                    ))}
                    {participants.length > 10 && (
                      <div className="text-sm text-gray-500 py-1">... ve {participants.length - 10} kişi daha</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === "prizes" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Hediye Ekleme
              </CardTitle>
              <CardDescription>Her hediyeyi ayrı ayrı ekleyin ve ayarlarını yapın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Yeni Hediye Ekleme */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium mb-4">Yeni Hediye Ekle</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="prize-name">Hediye Adı</Label>
                    <Input
                      id="prize-name"
                      value={newPrizeName}
                      onChange={(e) => setNewPrizeName(e.target.value)}
                      placeholder="iPhone 15 Pro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="winner-count">Kazanan Sayısı</Label>
                    <Input
                      id="winner-count"
                      type="number"
                      min="1"
                      value={newPrizeWinners}
                      onChange={(e) => setNewPrizeWinners(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backup-count">Yedek Sayısı</Label>
                    <Input
                      id="backup-count"
                      type="number"
                      min="0"
                      value={newPrizeBackups}
                      onChange={(e) => setNewPrizeBackups(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={addPrize} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Hediye Ekle
                </Button>
              </div>

              {/* Eklenen Hediyeler */}
              {prizes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Eklenen Hediyeler ({prizes.length})</h3>
                  {prizes.map((prize) => (
                    <div key={prize.id} className="border rounded-lg p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                          <Label>Hediye Adı</Label>
                          <Input value={prize.name} onChange={(e) => updatePrize(prize.id, "name", e.target.value)} />
                        </div>
                        <div>
                          <Label>Kazanan Sayısı</Label>
                          <Input
                            type="number"
                            min="1"
                            value={prize.winnerCount}
                            onChange={(e) => updatePrize(prize.id, "winnerCount", Number(e.target.value))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label>Yedek Sayısı</Label>
                            <Input
                              type="number"
                              min="0"
                              value={prize.backupCount}
                              onChange={(e) => updatePrize(prize.id, "backupCount", Number(e.target.value))}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removePrize(prize.id)}
                            className="text-red-600 hover:text-red-700 mt-6"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Çekiliş Ayarları
              </CardTitle>
              <CardDescription>Çekiliş öncesi son kontroller</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-green-700">✅ Katılımcılar</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{participants.length}</div>
                    <div className="text-sm text-green-600">Toplam Katılımcı</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-blue-700">🎁 Hediyeler</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{prizes.length}</div>
                    <div className="text-sm text-blue-600">Toplam Hediye</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Hediye Detayları</h3>
                {prizes.map((prize, index) => (
                  <div key={prize.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{prize.name}</div>
                      <div className="text-sm text-gray-600">
                        {prize.winnerCount} kazanan + {prize.backupCount} yedek ={" "}
                        {prize.winnerCount + prize.backupCount} kişi
                      </div>
                    </div>
                    <Badge variant="secondary">{index + 1}</Badge>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="font-medium text-yellow-800 mb-2">⚠️ Önemli Bilgi</div>
                <div className="text-sm text-yellow-700">
                  Toplam {prizes.reduce((sum, prize) => sum + prize.winnerCount + prize.backupCount, 0)} kişi seçilecek.
                  {participants.length <
                    prizes.reduce((sum, prize) => sum + prize.winnerCount + prize.backupCount, 0) && (
                    <div className="mt-2 text-red-600 font-medium">
                      ❌ Yetersiz katılımcı! En az{" "}
                      {prizes.reduce((sum, prize) => sum + prize.winnerCount + prize.backupCount, 0)} katılımcı gerekli.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "draw" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Çekiliş Zamanı
              </CardTitle>
              <CardDescription>Çekilişi başlatmaya hazır mısınız?</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {!isCountdownActive && !showResults && (
                <div className="space-y-4">
                  <div className="text-lg text-gray-600">{prizes.length} hediye için çekiliş yapılacak</div>
                  <Button
                    onClick={startCountdown}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    🎉 Çekilişi Başlat
                  </Button>
                </div>
              )}

              {isCountdownActive && (
                <div className="space-y-4">
                  <div className="text-8xl font-bold text-purple-600 animate-pulse">{countdown}</div>
                  <p className="text-xl text-gray-600">Çekiliş başlıyor...</p>
                  <div className="text-sm text-gray-500">Kazananlar belirleniyor</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === "results" && showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Çekiliş Sonuçları
              </CardTitle>
              <CardDescription>🎉 Tebrikler! Kazananlar belirlendi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prizes.map((prize) => {
                const prizeWinners = winners.filter((w) => w.prize.id === prize.id)
                const mainWinners = prizeWinners.filter((w) => !w.isBackup)
                const backupWinners = prizeWinners.filter((w) => w.isBackup)

                return (
                  <div key={prize.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-purple-700">🎁 {prize.name}</h3>
                      <Badge variant="outline">
                        {mainWinners.length} kazanan + {backupWinners.length} yedek
                      </Badge>
                    </div>

                    {mainWinners.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-3">🏆 Kazananlar:</h4>
                        <div className="grid gap-3">
                          {mainWinners.map((winner, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-l-4 border-green-500"
                            >
                              <div className="font-bold text-lg text-green-800">{winner.participant.name}</div>
                              {winner.participant.email && (
                                <div className="text-sm text-green-600">📧 {winner.participant.email}</div>
                              )}
                              {winner.participant.phone && (
                                <div className="text-sm text-green-600">📱 {winner.participant.phone}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {backupWinners.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-700 mb-3">🔄 Yedekler:</h4>
                        <div className="grid gap-3">
                          {backupWinners.map((winner, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border-l-4 border-orange-500"
                            >
                              <div className="font-medium text-orange-800">{winner.participant.name}</div>
                              {winner.participant.email && (
                                <div className="text-sm text-orange-600">📧 {winner.participant.email}</div>
                              )}
                              {winner.participant.phone && (
                                <div className="text-sm text-orange-600">📱 {winner.participant.phone}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {prize.id !== prizes[prizes.length - 1].id && <Separator />}
                  </div>
                )
              })}

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button onClick={exportResults} variant="outline" className="gap-2 flex-1">
                  <Download className="w-4 h-4" />
                  Sonuçları Excel'e Aktar
                </Button>
                <Button onClick={resetApp} variant="outline" className="gap-2 flex-1">
                  🔄 Yeni Çekiliş Başlat
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {currentStep !== "results" && (
          <div className="flex justify-between">
            <Button onClick={prevStep} disabled={!canGoPrev()} variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Geri
            </Button>

            <Button onClick={nextStep} disabled={!canGoNext()} className="gap-2">
              İleri
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
