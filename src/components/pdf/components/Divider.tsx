import { View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

interface DividerProps {
  spacing?: 'sm' | 'md' | 'lg'
  variant?: 'line' | 'dots' | 'space'
}

const spacingMap = {
  sm: 12,
  md: 24,
  lg: 40,
}

export function Divider({ spacing = 'md', variant = 'line' }: DividerProps) {
  const margin = spacingMap[spacing]

  if (variant === 'space') {
    return <View style={{ marginVertical: margin }} />
  }

  if (variant === 'dots') {
    return (
      <View
        style={{
          marginVertical: margin,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: colors.champagne,
            fontSize: 12,
            letterSpacing: 8,
            fontFamily: 'Helvetica',
          }}
        >
          · · ·
        </Text>
      </View>
    )
  }

  return (
    <View
      style={{
        height: 0.5,
        backgroundColor: colors.champagneLight,
        marginVertical: margin,
      }}
    />
  )
}
