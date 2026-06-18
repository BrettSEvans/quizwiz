'use client'

import { useState, useEffect } from 'react'
import { Logo, Button, Card } from '@/components/primitives'
import { Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react'

interface Package {
  id: string
  name: string
  status: 'draft' | 'published'
  roundCount: number
  lastUpdated: string
}

interface Round {
  index: number
  name: string
  type: 'standard' | 'optional' | 'custom'
  questions: Question[]
}

interface Question {
  id: string
  index: number
  text: string
  type: 'standard' | 'musical' | 'bonus' | 'custom'
  musicalArtistLabel?: string
  musicalYearLabel?: string
}

export default function QuizmasterPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [showNewPackageForm, setShowNewPackageForm] = useState(false)
  const [newPackageName, setNewPackageName] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null)

  // Mock data for demo
  useEffect(() => {
    setPackages([
      {
        id: 'pkg1',
        name: 'General Knowledge 2024',
        status: 'published',
        roundCount: 3,
        lastUpdated: '2 days ago',
      },
      {
        id: 'pkg2',
        name: 'Sports Trivia (Draft)',
        status: 'draft',
        roundCount: 2,
        lastUpdated: 'just now',
      },
    ])
  }, [])

  const handleCreatePackage = () => {
    if (!newPackageName.trim()) return
    const newPkg: Package = {
      id: `pkg_${Date.now()}`,
      name: newPackageName,
      status: 'draft',
      roundCount: 0,
      lastUpdated: 'just now',
    }
    setPackages([newPkg, ...packages])
    setNewPackageName('')
    setShowNewPackageForm(false)
    setSelectedPackageId(newPkg.id)
  }

  const handleDeletePackage = (id: string) => {
    setPackages(packages.filter((p) => p.id !== id))
    if (selectedPackageId === id) {
      setSelectedPackageId(null)
    }
  }

  const handleValidate = () => {
    const errors: string[] = []
    const pkg = packages.find((p) => p.id === selectedPackageId)
    if (!pkg) return

    if (pkg.roundCount === 0) {
      errors.push('Package must have at least 1 round')
    }
    if (pkg.roundCount > 20) {
      errors.push('Package cannot exceed 20 rounds')
    }
    // Additional validation would happen here

    setValidationErrors(errors)
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
                        <span className="text-xs font-bold bg-[var(--blue)] text-white px-2 py-1 rounded-none">
                          PUB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] font-bold mb-2">
                      {pkg.roundCount} rounds • {pkg.lastUpdated}
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
                    defaultValue={selectedPackage.name}
                    className="w-full border-2 border-black p-3 font-black text-2xl uppercase mb-4"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleValidate} className="flex-1">
                      Validate
                    </Button>
                    <Button
                      variant={selectedPackage.status === 'draft' ? 'secondary' : 'outline'}
                      disabled={selectedPackage.status === 'published'}
                      className="flex-1"
                    >
                      {selectedPackage.status === 'published' ? 'Published ✓' : 'Publish'}
                    </Button>
                  </div>
                </div>

                {/* Rounds Matrix */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-6">
                  <h3 className="text-2xl font-black uppercase mb-6">Rounds</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((roundNum) => (
                      <div key={roundNum} className="border-2 border-black p-4">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <input
                            type="text"
                            placeholder={`Round ${roundNum}`}
                            defaultValue={`Round ${roundNum}`}
                            className="flex-1 border-2 border-black p-2 font-bold uppercase"
                          />
                          <select
                            defaultValue="standard"
                            className="border-2 border-black p-2 font-bold uppercase text-sm"
                          >
                            <option value="standard">Standard</option>
                            <option value="optional">Optional</option>
                            <option value="custom">Custom</option>
                          </select>
                          <button className="p-2 hover:bg-[var(--muted)]" onClick={() => setEditingRoundIndex(null)}>
                            <Trash2 size={20} />
                          </button>
                        </div>

                        {/* Questions */}
                        <div className="space-y-2 bg-[var(--muted)] p-4 rounded-none">
                          {[1, 2, 3, 4].map((qNum) => (
                            <div key={qNum} className="flex items-center gap-2">
                              <span className="font-bold w-8 text-center text-sm">Q{qNum}:</span>
                              <input
                                type="text"
                                placeholder="Question text"
                                className="flex-1 border-2 border-black p-2 text-sm"
                              />
                              <select className="border-2 border-black p-2 text-sm">
                                <option>Standard</option>
                                <option>Musical</option>
                                <option>Bonus</option>
                                <option>Custom</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tiebreaker */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-6">
                  <h3 className="text-2xl font-black uppercase mb-4">Tiebreaker Question</h3>
                  <select className="w-full border-4 border-black p-4 font-bold uppercase text-lg bg-[var(--yellow)]">
                    <option>Select tiebreaker question...</option>
                    <option>Round 1, Question 1</option>
                    <option>Round 1, Question 2</option>
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
