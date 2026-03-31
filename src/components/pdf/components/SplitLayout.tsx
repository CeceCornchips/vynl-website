import { View } from '@react-pdf/renderer'
import { ReactNode } from 'react'

interface SplitLayoutProps {
  leftContent: ReactNode
  rightContent: ReactNode
  split?: '50/50' | '60/40' | '40/60'
}

function getSplitFlex(split: SplitLayoutProps['split']): [number, number] {
  switch (split) {
    case '60/40':
      return [3, 2]
    case '40/60':
      return [2, 3]
    case '50/50':
    default:
      return [1, 1]
  }
}

export function SplitLayout({ leftContent, rightContent, split = '50/50' }: SplitLayoutProps) {
  const [leftFlex, rightFlex] = getSplitFlex(split)

  return (
    <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
      <View style={{ flex: leftFlex }}>{leftContent}</View>
      <View style={{ flex: rightFlex }}>{rightContent}</View>
    </View>
  )
}
