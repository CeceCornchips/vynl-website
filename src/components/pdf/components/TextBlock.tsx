import { View, Text } from '@react-pdf/renderer'
import { colors } from '../styles/pdfStyles'

interface TextBlockProps {
  heading?: string
  body: string | string[]
}

export function TextBlock({ heading, body }: TextBlockProps) {
  const paragraphs = Array.isArray(body) ? body : [body]

  return (
    <View style={{ marginBottom: 16 }}>
      {heading && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            lineHeight: 1.4,
            marginBottom: 8,
          }}
        >
          {heading}
        </Text>
      )}
      {paragraphs.map((paragraph, index) => (
        <Text
          key={index}
          style={{
            fontSize: 11,
            color: colors.gray900,
            lineHeight: 1.65,
            fontFamily: 'Helvetica',
            marginBottom: index < paragraphs.length - 1 ? 12 : 0,
          }}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  )
}
