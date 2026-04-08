import { create } from 'zustand'

interface ExampleState {
  selected: number | null
  setSelected: (id: number | null) => void
}

export const useExampleStore = create<ExampleState>((set) => ({
  selected: null,
  setSelected: (id) => set({ selected: id }),
}))
