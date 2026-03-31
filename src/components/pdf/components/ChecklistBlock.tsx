import { View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

interface ChecklistSection {
  heading?: string
  items: string[]
}

interface ChecklistBlockProps {
  title?: string
  sections: ChecklistSection[]
}

export function ChecklistBlock({ title, sections }: ChecklistBlockProps) {
  return (
    <View style={{ marginVertical: 12 }}>
      {title && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            lineHeight: 1.4,
            marginBottom: 16,
          }}
        >
          {title}
        </Text>
      )}
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={{ marginBottom: 20 }}>
          {section.heading && (
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 10,
              }}
            >
              {section.heading}
            </Text>
          )}
          {section.items.map((item, itemIndex) => (
            <View
              key={itemIndex}
              style={{
                flexDirection: 'row',
                marginBottom: 8,
                alignItems: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderWidth: 1,
                  borderColor: colors.gray400,
                  marginRight: 10,
                  marginTop: 1,
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.gray900,
                  lineHeight: 1.55,
                  fontFamily: 'Helvetica',
                  flex: 1,
                }}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
