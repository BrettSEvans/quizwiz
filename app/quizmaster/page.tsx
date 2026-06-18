'use client'

import { useState, useEffect } from 'react'
import { Logo, Button, Card } from '@/components/primitives'
import { Plus, Trash2, Edit2, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Question {
  id: string
  index: number
  text: string
  type: 'standard' | 'musical' | 'bonus' | 'custom'
  musicalArtistLabel?: string
  musicalYearLabel?: string
}

interface Round {
  id: string
  index: number
  name: string
  type: 'standard' | 'optional' | 'custom'
  questions: Question[]
}

interface PackageData {
  id: string
  name: string
  status: 'draft' | 'published'
  rounds: Round[]
  tiebreakerId?: string
  lastUpdated: string
  createdAt: string
}

// Create 20 standard rounds with 4 questions each
const createDefaultRounds = (): Round[] => {
  const standardRoundNames = [
    'General Knowledge', 'History', 'Geography', 'Science & Nature',
    'Literature & Language', 'Movies & TV', 'Music', 'Sports',
    'Art & Design', 'Technology', 'Food & Drink', 'Entertainment',
    'Pop Culture', 'World Facts', 'Inventions', 'Landmarks',
    'Animals & Nature', 'Current Events', 'Miscellaneous I', 'Miscellaneous II',
  ]

  return standardRoundNames.map((name, idx) => ({
    id: `round_${idx}`,
    index: idx,
    name,
    type: 'standard' as const,
    questions: Array.from({ length: 4 }, (_, qIdx) => ({
      id: `q_${idx}_${qIdx}`,
      index: qIdx,
      text: '',
      type: 'standard' as const,
    })),
  }))
}

export default function QuizmasterPage() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [showNewPackageForm, setShowNewPackageForm] = useState(false)
  const [newPackageName, setNewPackageName] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())

  // Load packages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quizwiz_packages')
    if (saved) {
      setPackages(JSON.parse(saved))
    } else {
      // Demo package
      const demoPackage: PackageData = {
        id: 'demo_pkg',
        name: 'Sample Package',
        status: 'draft',
        rounds: createDefaultRounds(),
        lastUpdated: new Date().toLocaleString(),
        createdAt: new Date().toLocaleString(),
      }
      setPackages([demoPackage])
      setSelectedPackageId(demoPackage.id)
    }
  }, [])

  // Save packages to localStorage whenever they change
  useEffect(() => {
    if (packages.length > 0) {
      localStorage.setItem('quizwiz_packages', JSON.stringify(packages))
    }
  }, [packages])

  const handleCreatePackage = () => {
    if (!newPackageName.trim()) return
    const newPkg: PackageData = {
      id: `pkg_${Date.now()}`,
      name: newPackageName,
      status: 'draft',
      rounds: createDefaultRounds(),
      lastUpdated: new Date().toLocaleString(),
      createdAt: new Date().toLocaleString(),
    }
    setPackages([newPkg, ...packages])
    setNewPackageName('')
    setShowNewPackageForm(false)
    setSelectedPackageId(newPkg.id)
    // Expand all rounds by default for new package
    const allRoundIds = new Set(newPkg.rounds.map((r) => r.id))
    setExpandedRounds(allRoundIds)
  }

  const handleDeletePackage = (id: string) => {
    setPackages(packages.filter((p) => p.id !== id))
    if (selectedPackageId === id) {
      setSelectedPackageId(null)
    }
  }

  const handleUpdatePackage = (id: string, updates: Partial<PackageData>) => {
    setPackages(
      packages.map((p) =>
        p.id === id
          ? { ...p, ...updates, lastUpdated: new Date().toLocaleString() }
          : p
      )
    )
  }

  const handleUpdateRound = (roundId: string, updates: Partial<Round>) => {
    if (!selectedPackageId) return
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg) return

    const updatedRounds = pkg.rounds.map((r) =>
      r.id === roundId ? { ...r, ...updates } : r
    )
    handleUpdatePackage(selectedPackageId, { rounds: updatedRounds })
  }

  const handleUpdateQuestion = (roundId: string, questionId: string, updates: Partial<Question>) => {
    if (!selectedPackageId) return
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg) return

    const updatedRounds = pkg.rounds.map((r) =>
      r.id === roundId
        ? {
            ...r,
            questions: r.questions.map((q) =>
              q.id === questionId ? { ...q, ...updates } : q
            ),
          }
        : r
    )
    handleUpdatePackage(selectedPackageId, { rounds: updatedRounds })
  }

  const handleAddRound = () => {
    if (!selectedPackageId) return
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg || pkg.rounds.length >= 20) return

    const newRound: Round = {
      id: `round_${Date.now()}`,
      index: pkg.rounds.length,
      name: `Round ${pkg.rounds.length + 1}`,
      type: 'standard',
      questions: Array.from({ length: 4 }, (_, idx) => ({
        id: `q_${Date.now()}_${idx}`,
        index: idx,
        text: '',
        type: 'standard' as const,
      })),
    }

    const updatedRounds = [...pkg.rounds, newRound]
    handleUpdatePackage(selectedPackageId, { rounds: updatedRounds })
    setExpandedRounds(new Set([...expandedRounds, newRound.id]))
  }

  const handleRemoveRound = (roundId: string) => {
    if (!selectedPackageId) return
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg) return

    const updatedRounds = pkg.rounds.filter((r) => r.id !== roundId)
    handleUpdatePackage(selectedPackageId, { rounds: updatedRounds })
    setExpandedRounds(new Set([...expandedRounds].filter((id) => id !== roundId)))
  }

  const handleAddQuestion = (roundId: string) => {
    if (!selectedPackageId) return
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg) return

    const updatedRounds = pkg.rounds.map((r) => {
      if (r.id === roundId && r.questions.length < 10) {
        return {
          ...r,
          questions: [
            ...r.questions,
            {
              id: `q_${Date.now()}`,
              index: r.questions.length,
              text: '',
              type: 'standard' as const,
            },
          ],
        }
      }
      return r
    })
    handleUpdatePackage(selectedPackageId, { rounds: updatedRounds })
  }

  const handleRemoveQuestion = (roundId: string, questionId: string) => {
    if (!selectedPackageId) return
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg) return

    const updatedRounds = pkg.rounds.map((r) =>
      r.id === roundId
        ? {
            ...r,
            questions: r.questions.filter((q) => q.id !== questionId),
          }
        : r
    )
    handleUpdatePackage(selectedPackageId, { rounds: updatedRounds })
  }

  const handleValidate = () => {
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg) return

    const errors: string[] = []
    if (pkg.rounds.length === 0) {
      errors.push('Package must have at least 1 round')
    }
    if (pkg.rounds.length > 20) {
      errors.push('Package cannot exceed 20 rounds')
    }
    pkg.rounds.forEach((round) => {
      if (round.questions.length < 4) {
        errors.push(`${round.name} has only ${round.questions.length} question(s), need at least 4`)
      }
      round.questions.forEach((q, idx) => {
        if (!q.text.trim()) {
          errors.push(`${round.name}, Question ${idx + 1} is empty`)
        }
      })
    })
    if (!pkg.tiebreakerId) {
      errors.push('Tiebreaker question must be selected')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const toggleRoundExpanded = (roundId: string) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(roundId)) {
      newExpanded.delete(roundId)
    } else {
      newExpanded.add(roundId)
    }
    setExpandedRounds(newExpanded)
  }

  const selectedPackage = packages.find((p) => p.id === selectedPackageId)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Logo size="lg" />
            <div>
              <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tighter text-[var(--fg)]">
                Quizmaster
              </h1>
              <p className="text-lg mt-2 font-bold uppercase">Create & publish trivia packages</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowNewPackageForm(true)}
            className="h-14 px-8 flex items-center gap-2"
          >
            <Plus size={20} /> New Package
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Package List */}
          <div className="lg:col-span-1">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-6">
              <h2 className="text-2xl font-black uppercase mb-6">Your Packages</h2>

              {/* New Package Form */}
              {showNewPackageForm && (
                <div className="mb-6 p-4 border-2 border-[var(--blue)] bg-[var(--muted)]">
                  <input
                    type="text"
                    placeholder="Package name"
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                    className="w-full border-2 border-black p-2 font-sans mb-3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleCreatePackage}
                      className="flex-1 text-sm py-2"
                    >
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPackageForm(false)}
                      className="flex-1 text-sm py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      selectedPackageId === pkg.id
                        ? 'border-[var(--blue)] bg-[var(--muted)]'
                        : 'border-black hover:bg-[var(--muted)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-black uppercase text-sm flex-1">{pkg.name}</h3>
                      {pkg.status === 'published' && (
                        <span className="text-xs font-bold bg-[var(--blue)] text-white px-2 py-1">
                          PUB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] font-bold mb-2">
                      {pkg.rounds.length} rounds
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePackage(pkg.id)
                      }}
                      className="text-xs font-bold text-[var(--red)] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            {selectedPackage ? (
              <div className="space-y-6">
                {/* Validation Alert */}
                {validationErrors.length > 0 && (
                  <div className="bg-[var(--yellow)] border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
                    <div className="flex gap-3 mb-4">
                      <AlertCircle size={24} className="flex-shrink-0" />
                      <h3 className="font-black uppercase text-lg">Validation Issues</h3>
                    </div>
                    <ul className="space-y-2 ml-9">
                      {validationErrors.map((error, i) => (
                        <li key={i} className="text-sm font-bold">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Package Header */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-6">
                  <input
                    type="text"
                    value={selectedPackage.name}
                    onChange={(e) =>
                      handleUpdatePackage(selectedPackageId!, { name: e.target.value })
                    }
                    className="w-full border-2 border-black p-3 font-black text-2xl uppercase mb-4"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleValidate}
                      className="flex-1"
                    >
                      Validate
                    </Button>
                    <Button
                      variant={selectedPackage.status === 'draft' ? 'secondary' : 'outline'}
                      disabled={selectedPackage.status === 'published'}
                      className="flex-1"
                      onClick={() => {
                        if (handleValidate()) {
                          handleUpdatePackage(selectedPackageId!, {
                            status: 'published',
                          })
                        }
                      }}
                    >
                      {selectedPackage.status === 'published' ? 'Published ✓' : 'Publish'}
                    </Button>
                  </div>
                </div>

                {/* Rounds */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black uppercase">
                      Rounds ({selectedPackage.rounds.length}/20)
                    </h3>
                    {selectedPackage.rounds.length < 20 && (
                      <Button
                        variant="primary"
                        onClick={handleAddRound}
                        className="text-sm py-2 px-4 flex items-center gap-2"
                      >
                        <Plus size={16} /> Add Round
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedPackage.rounds.map((round) => (
                      <div key={round.id} className="border-2 border-black">
                        {/* Round Header */}
                        <button
                          onClick={() => toggleRoundExpanded(round.id)}
                          className="w-full p-4 bg-[var(--muted)] flex items-center justify-between gap-4 hover:bg-opacity-75"
                        >
                          <div className="flex items-center gap-3 flex-1 text-left">
                            {expandedRounds.has(round.id) ? (
                              <ChevronUp size={20} className="flex-shrink-0" />
                            ) : (
                              <ChevronDown size={20} className="flex-shrink-0" />
                            )}
                            <input
                              type="text"
                              value={round.name}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleUpdateRound(round.id, { name: e.target.value })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold uppercase flex-1 border-2 border-black p-2 bg-white"
                            />
                            <select
                              value={round.type}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleUpdateRound(round.id, {
                                  type: e.target.value as Round['type'],
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="border-2 border-black p-2 font-bold uppercase text-sm bg-white"
                            >
                              <option value="standard">Standard</option>
                              <option value="optional">Optional</option>
                              <option value="custom">Custom</option>
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveRound(round.id)
                              }}
                              className="p-2 hover:bg-[var(--red)] hover:text-white"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </button>

                        {/* Questions */}
                        {expandedRounds.has(round.id) && (
                          <div className="p-4 space-y-3 bg-white">
                            {round.questions.map((q, qIdx) => (
                              <div key={q.id} className="flex items-end gap-2">
                                <span className="font-bold text-sm w-12 flex-shrink-0 text-center">
                                  Q{qIdx + 1}:
                                </span>
                                <input
                                  type="text"
                                  value={q.text}
                                  onChange={(e) =>
                                    handleUpdateQuestion(round.id, q.id, {
                                      text: e.target.value,
                                    })
                                  }
                                  placeholder="Question text"
                                  className="flex-1 border-2 border-black p-2 text-sm"
                                />
                                <select
                                  value={q.type}
                                  onChange={(e) =>
                                    handleUpdateQuestion(round.id, q.id, {
                                      type: e.target.value as Question['type'],
                                    })
                                  }
                                  className="border-2 border-black p-2 text-sm bg-white"
                                >
                                  <option value="standard">Standard</option>
                                  <option value="musical">Musical</option>
                                  <option value="bonus">Bonus</option>
                                  <option value="custom">Custom</option>
                                </select>
                                <button
                                  onClick={() =>
                                    handleRemoveQuestion(round.id, q.id)
                                  }
                                  className="p-2 hover:bg-[var(--red)] hover:text-white flex-shrink-0"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))}
                            {round.questions.length < 10 && (
                              <button
                                onClick={() => handleAddQuestion(round.id)}
                                className="w-full text-sm font-bold text-[var(--blue)] hover:underline py-2 border-t-2 border-[var(--muted)]"
                              >
                                + Add Question
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tiebreaker */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-6">
                  <h3 className="text-2xl font-black uppercase mb-4">Tiebreaker Question</h3>
                  <select
                    value={selectedPackage.tiebreakerId || ''}
                    onChange={(e) =>
                      handleUpdatePackage(selectedPackageId!, {
                        tiebreakerId: e.target.value,
                      })
                    }
                    className="w-full border-4 border-black p-4 font-bold uppercase text-lg bg-[var(--yellow)]"
                  >
                    <option value="">Select tiebreaker question...</option>
                    {selectedPackage.rounds.map((round) =>
                      round.questions.map((q) => (
                        <option
                          key={q.id}
                          value={q.id}
                        >
                          {round.name} - Q{q.index + 1}: {q.text.substring(0, 50)}
                          {q.text.length > 50 ? '...' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <h3 className="text-2xl font-black uppercase mb-4">Select a Package</h3>
                  <p className="text-lg text-[var(--muted)] mb-6">or create a new one to get started</p>
                  <Button variant="primary" onClick={() => setShowNewPackageForm(true)}>
                    Create First Package
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
