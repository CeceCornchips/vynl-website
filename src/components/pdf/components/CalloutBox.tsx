import { View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

interface CalloutBoxProps {
  variant: 'pro' | 'warning' | 'critical'
  label?: string
  content: string
}

const variantConfig = {
  pro: {
    backgroundColor: colors.warmLight,
    borderColor: colors.champagne,
    icon: '✦',
    defaultLabel: 'PRO TIP',
    labelColor: colors.champagneDark,
  },
  warning: {
    backgroundColor: '#FEF3F2',
    borderColor: '#E53E3E',
    icon: '⚠',
    defaultLabel: 'AVOID THIS',
    labelColor: '#C53030',
  },
  critical: {
    backgroundColor: '#FFFBEB',
    borderColor: colors.champagneDark,
    icon: '⚡',
    defaultLabel: 'CRITICAL',
    labelColor: colors.champagneDark,
  },
}

export function CalloutBox({ variant, label, content }: CalloutBoxProps) {
  const config = variantConfig[variant]
  const displayLabel = label ?? config.defaultLabel

  return (
    <View
      style={{
        backgroundColor: config.backgroundColor,
        borderLeftWidth: 3,
        borderLeftColor: config.borderColor,
        padding: 16,
        borderRadius: 4,
        marginVertical: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text
          style={{
            fontSize: 10,
            color: config.labelColor,
            marginRight: 6,
            fontFamily: 'Helvetica',
          }}
        >
          {config.icon}
        </Text>
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'Helvetica-Bold',
            color: config.labelColor,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {displayLabel}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 10,
          color: colors.gray900,
          lineHeight: 1.6,
          fontFamily: 'Helvetica',
        }}
      >
        {content}
      </Text>
    </View>
  )
}
