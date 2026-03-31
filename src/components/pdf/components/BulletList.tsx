import { View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

interface BulletItem {
  text: string
  bold?: boolean
  subtext?: string
}

interface BulletListProps {
  heading?: string
  items: BulletItem[]
  variant?: 'dot' | 'number' | 'check' | 'dash'
}

function getBulletChar(variant: BulletListProps['variant'], index: number): string {
  switch (variant) {
    case 'number':
      return `${index + 1}.`
    case 'check':
      return '✓'
    case 'dash':
      return '—'
    case 'dot':
    default:
      return '•'
  }
}

export function BulletList({ heading, items, variant = 'dot' }: BulletListProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      {heading && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          {heading}
        </Text>
      )}
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' }}>
          <Text
            style={{
              color: colors.champagne,
              marginRight: 10,
              fontSize: variant === 'dot' ? 14 : 11,
              fontFamily: variant === 'number' ? 'Helvetica-Bold' : 'Helvetica',
              lineHeight: 1.65,
              minWidth: variant === 'number' ? 20 : 14,
            }}
          >
            {getBulletChar(variant, index)}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                color: colors.gray900,
                lineHeight: 1.65,
                fontFamily: item.bold ? 'Helvetica-Bold' : 'Helvetica',
              }}
            >
              {item.text}
            </Text>
            {item.subtext && (
              <Text
                style={{
                  fontSize: 9,
                  color: colors.gray600,
                  lineHeight: 1.6,
                  fontFamily: 'Helvetica',
                  marginTop: 2,
                }}
              >
                {item.subtext}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}
