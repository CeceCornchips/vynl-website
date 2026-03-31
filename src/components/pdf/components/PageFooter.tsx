import { View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

interface PageFooterProps {
  pageNumber: number
}

export function PageFooter({ pageNumber }: PageFooterProps) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 24,
        left: 52,
        right: 52,
      }}
    >
      {/* Top divider line */}
      <View
        style={{
          height: 0.5,
          backgroundColor: colors.champagneLight,
          marginBottom: 10,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 7,
            color: colors.champagne,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontFamily: 'Helvetica',
          }}
        >
          VYNL ACADEMY
        </Text>
        <Text
          style={{
            fontSize: 7,
            color: colors.champagne,
            fontFamily: 'Helvetica',
          }}
        >
          ·
        </Text>
        <Text
          style={{
            fontSize: 7,
            color: colors.gray400,
            fontFamily: 'Helvetica',
          }}
        >
          {pageNumber}
        </Text>
      </View>
    </View>
  )
}
