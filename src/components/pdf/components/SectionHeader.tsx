import { View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

interface SectionHeaderProps {
  sectionNumber: string
  sectionLabel: string
  title: string
  subtitle?: string
}

export function SectionHeader({ sectionNumber, sectionLabel, title, subtitle }: SectionHeaderProps) {
  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          backgroundColor: colors.smoke,
          padding: 28,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        {/* Section number */}
        <Text
          style={{
            fontSize: 48,
            fontFamily: 'Helvetica-Bold',
            color: colors.champagne,
            opacity: 0.15,
            marginRight: 20,
            lineHeight: 1,
          }}
        >
          {sectionNumber}
        </Text>

        {/* Vertical divider */}
        <View
          style={{
            width: 0.5,
            backgroundColor: colors.champagne,
            marginRight: 20,
            alignSelf: 'stretch',
          }}
        />

        {/* Text block */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: 3,
              color: colors.champagne,
              fontFamily: 'Helvetica-Bold',
              marginBottom: 6,
            }}
          >
            {sectionLabel}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontFamily: 'Helvetica-Bold',
              color: colors.black,
              lineHeight: 1.2,
              marginBottom: subtitle ? 4 : 0,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 11,
                color: colors.gray600,
                fontFamily: 'Helvetica',
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom champagne divider */}
      <View
        style={{
          height: 0.5,
          backgroundColor: colors.champagne,
        }}
      />
    </View>
  )
}
