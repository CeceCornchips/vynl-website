import { Page, View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

export function CoverPage() {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: colors.black,
        paddingHorizontal: 52,
        paddingVertical: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Helvetica',
      }}
    >
      {/* Top spacer */}
      <View style={{ flex: 0.3 }} />

      {/* Center content */}
      <View style={{ alignItems: 'center', flex: 0.5 }}>
        <Text
          style={{
            fontSize: 8,
            color: colors.champagne,
            letterSpacing: 4,
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: 'Helvetica',
            marginBottom: 24,
          }}
        >
          VYNL ACADEMY PRESENTS
        </Text>

        <Text
          style={{
            fontSize: 36,
            fontFamily: 'Helvetica-Bold',
            color: colors.white,
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 4,
          }}
        >
          THE GEL-X RETENTION
        </Text>
        <Text
          style={{
            fontSize: 36,
            fontFamily: 'Helvetica-Bold',
            color: colors.white,
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          MASTERY GUIDE
        </Text>

        {/* Champagne rule */}
        <View
          style={{
            width: 240,
            height: 0.5,
            backgroundColor: colors.champagne,
            marginBottom: 16,
          }}
        />

        <Text
          style={{
            fontSize: 12,
            color: colors.champagneLight,
            textAlign: 'center',
            fontFamily: 'Helvetica',
          }}
        >
          Professional Application Techniques for 3–4 Week Wear
        </Text>
      </View>

      {/* Bottom area */}
      <View style={{ flex: 0.2, alignItems: 'center', justifyContent: 'flex-end' }}>
        <Text
          style={{
            fontSize: 8,
            color: colors.champagne,
            letterSpacing: 3,
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: 'Helvetica',
            marginBottom: 8,
          }}
        >
          BY VYNL ACADEMY
        </Text>
        <Text
          style={{
            fontSize: 8,
            color: colors.gray600,
            textAlign: 'center',
            fontFamily: 'Helvetica',
          }}
        >
          2025 EDITION
        </Text>
      </View>
    </Page>
  )
}
