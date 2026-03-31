import { Document, Page, View, Text } from '@react-pdf/renderer'
import { CoverPage } from './components/CoverPage'
import { SectionHeader } from './components/SectionHeader'
import { TextBlock } from './components/TextBlock'
import { BulletList } from './components/BulletList'
import { CalloutBox } from './components/CalloutBox'
import { ChecklistBlock } from './components/ChecklistBlock'
import { SplitLayout } from './components/SplitLayout'
import { PageFooter } from './components/PageFooter'
import { Divider } from './components/Divider'
import { colors } from './styles/pdfStyles'
import {
  tocEntries,
  introductionContent,
  nailScienceContent,
  prepSystemContent,
  tipApplicationContent,
  antiLiftingCauses,
  antiLiftingSectionCallout,
  retentionProtocolContent,
  commonMistakesContent,
  proTipsContent,
  aftercareContent,
  mythsVsFacts,
  fullChecklistContent,
} from './content/gelXContent'

const pageStyle = {
  backgroundColor: colors.offWhite,
  paddingTop: 48,
  paddingBottom: 60,
  paddingHorizontal: 52,
  fontFamily: 'Helvetica',
}

// ─── TABLE OF CONTENTS PAGE ──────────────────────────────────────────────────

function TableOfContentsPage() {
  return (
    <Page size="A4" style={pageStyle}>
      <View style={{ marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: 3,
            color: colors.champagne,
            fontFamily: 'Helvetica-Bold',
            marginBottom: 8,
          }}
        >
          CONTENTS
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          What&apos;s Inside
        </Text>
        <View style={{ height: 0.5, backgroundColor: colors.champagneLight, marginTop: 16 }} />
      </View>

      <View>
        {tocEntries.map((entry, index) => (
          <View key={index}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  color: colors.champagne,
                  fontFamily: 'Helvetica-Bold',
                  marginRight: 14,
                  letterSpacing: 1,
                }}
              >
                {entry.number}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Helvetica-Bold',
                    color: colors.black,
                    lineHeight: 1.3,
                  }}
                >
                  {entry.title}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: colors.gray600,
                    fontFamily: 'Helvetica',
                    marginTop: 2,
                  }}
                >
                  {entry.subtitle}
                </Text>
              </View>
              {/* Dot leaders */}
              <View
                style={{
                  flex: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginHorizontal: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    color: colors.gray400,
                    fontFamily: 'Helvetica',
                    letterSpacing: 4,
                  }}
                >
                  · · · · ·
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.champagne,
                  fontFamily: 'Helvetica-Bold',
                  minWidth: 20,
                  textAlign: 'right',
                }}
              >
                {entry.page}
              </Text>
            </View>
            <View style={{ height: 0.5, backgroundColor: colors.gray200 }} />
          </View>
        ))}
      </View>

      <PageFooter pageNumber={2} />
    </Page>
  )
}

// ─── INTRODUCTION PAGE ────────────────────────────────────────────────────────

function IntroductionPage() {
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={introductionContent.sectionNumber}
        sectionLabel={introductionContent.sectionLabel}
        title={introductionContent.title}
      />

      <TextBlock body={introductionContent.textBlock} />

      <Divider spacing="sm" />

      <BulletList
        heading={introductionContent.bulletList.heading}
        variant={introductionContent.bulletList.variant}
        items={introductionContent.bulletList.items}
      />

      <CalloutBox
        variant={introductionContent.callout.variant}
        content={introductionContent.callout.content}
      />

      <PageFooter pageNumber={3} />
    </Page>
  )
}

// ─── NAIL SCIENCE PAGES ───────────────────────────────────────────────────────

function NailSciencePage1() {
  const { nailPlate, oilMoisture } = nailScienceContent
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={nailScienceContent.sectionNumber}
        sectionLabel={nailScienceContent.sectionLabel}
        title={nailScienceContent.title}
      />

      <TextBlock heading={nailPlate.heading} body="The nail plate is a keratinous structure composed of three distinct layers, each with unique properties that directly affect how products bond to the surface." />

      <BulletList
        variant="dot"
        items={nailPlate.items}
      />

      <CalloutBox
        variant={nailPlate.callout.variant}
        content={nailPlate.callout.content}
      />

      <Divider spacing="md" />

      <TextBlock heading={oilMoisture.heading} body={oilMoisture.text} />

      <BulletList
        variant="dash"
        items={oilMoisture.warningItems}
      />

      <CalloutBox
        variant={oilMoisture.callout.variant}
        content={oilMoisture.callout.content}
      />

      <PageFooter pageNumber={4} />
    </Page>
  )
}

function NailSciencePage2() {
  const { cuticleVsPterygium, adhesion } = nailScienceContent
  return (
    <Page size="A4" style={pageStyle}>
      <TextBlock heading={cuticleVsPterygium.heading} body="Understanding the difference between the cuticle and pterygium is fundamental to professional Gel-X application." />

      <SplitLayout
        split="50/50"
        leftContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              {cuticleVsPterygium.cuticle.title}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.gray900,
                lineHeight: 1.65,
                fontFamily: 'Helvetica',
              }}
            >
              {cuticleVsPterygium.cuticle.text}
            </Text>
          </View>
        }
        rightContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagneDark,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              {cuticleVsPterygium.pterygium.title}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.gray900,
                lineHeight: 1.65,
                fontFamily: 'Helvetica',
              }}
            >
              {cuticleVsPterygium.pterygium.text}
            </Text>
          </View>
        }
      />

      <CalloutBox
        variant={cuticleVsPterygium.callout.variant}
        content={cuticleVsPterygium.callout.content}
      />

      <Divider spacing="md" />

      <TextBlock heading={adhesion.heading} body="Lasting retention requires two distinct types of adhesion working together simultaneously. Professional technicians understand both and ensure neither is skipped." />

      <SplitLayout
        split="50/50"
        leftContent={
          <View
            style={{
              backgroundColor: colors.gray100,
              padding: 16,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              {adhesion.mechanical.title}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.gray900,
                lineHeight: 1.6,
                fontFamily: 'Helvetica',
              }}
            >
              {adhesion.mechanical.text}
            </Text>
          </View>
        }
        rightContent={
          <View
            style={{
              backgroundColor: colors.gray100,
              padding: 16,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              {adhesion.chemical.title}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.gray900,
                lineHeight: 1.6,
                fontFamily: 'Helvetica',
              }}
            >
              {adhesion.chemical.text}
            </Text>
          </View>
        }
      />

      <CalloutBox
        variant={adhesion.callout.variant}
        content={adhesion.callout.content}
      />

      <PageFooter pageNumber={5} />
    </Page>
  )
}

// ─── PREP SYSTEM PAGES ────────────────────────────────────────────────────────

function PrepSystemPage1() {
  const steps = prepSystemContent.steps
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={prepSystemContent.sectionNumber}
        sectionLabel={prepSystemContent.sectionLabel}
        title={prepSystemContent.title}
      />

      {/* Step 1 */}
      <View style={{ marginBottom: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              color: colors.champagne,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginRight: 12,
            }}
          >
            STEP 01
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: colors.champagneLight }} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            marginBottom: 10,
          }}
        >
          {steps[0].title}
        </Text>
        <BulletList variant="number" items={steps[0].items} />
        {steps[0].callouts.map((callout, i) => (
          <CalloutBox key={i} variant={callout.variant} content={callout.content} />
        ))}
      </View>

      <PageFooter pageNumber={6} />
    </Page>
  )
}

function PrepSystemPage2() {
  const steps = prepSystemContent.steps
  return (
    <Page size="A4" style={pageStyle}>
      {/* Step 2 */}
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              color: colors.champagne,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginRight: 12,
            }}
          >
            STEP 02
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: colors.champagneLight }} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            marginBottom: 10,
          }}
        >
          {steps[1].title}
        </Text>
        {'text' in steps[1] && steps[1].text && <TextBlock body={steps[1].text as string} />}
        <BulletList variant="check" items={steps[1].items} />
        {steps[1].callouts.map((callout, i) => (
          <CalloutBox key={i} variant={callout.variant} content={callout.content} />
        ))}
      </View>

      <Divider spacing="md" />

      {/* Step 3 */}
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              color: colors.champagne,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginRight: 12,
            }}
          >
            STEP 03
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: colors.champagneLight }} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            marginBottom: 10,
          }}
        >
          {steps[2].title}
        </Text>
        <BulletList variant="check" items={steps[2].items} />
        {steps[2].callouts.map((callout, i) => (
          <CalloutBox key={i} variant={callout.variant} content={callout.content} />
        ))}
      </View>

      <PageFooter pageNumber={7} />
    </Page>
  )
}

function PrepSystemPage3() {
  const steps = prepSystemContent.steps
  return (
    <Page size="A4" style={pageStyle}>
      {/* Step 4 */}
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              color: colors.champagne,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginRight: 12,
            }}
          >
            STEP 04
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: colors.champagneLight }} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            marginBottom: 10,
          }}
        >
          {steps[3].title}
        </Text>
        <BulletList variant="check" items={steps[3].items} />
        {steps[3].callouts.map((callout, i) => (
          <CalloutBox key={i} variant={callout.variant} content={callout.content} />
        ))}
      </View>

      <Divider spacing="md" />

      {/* Step 5 */}
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              color: colors.champagne,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginRight: 12,
            }}
          >
            STEP 05
          </Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: colors.champagneLight }} />
        </View>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            marginBottom: 10,
          }}
        >
          {steps[4].title}
        </Text>
        <BulletList variant="check" items={steps[4].items} />
        {steps[4].callouts.map((callout, i) => (
          <CalloutBox key={i} variant={callout.variant} content={callout.content} />
        ))}
      </View>

      <PageFooter pageNumber={8} />
    </Page>
  )
}

// ─── TIP APPLICATION PAGES ────────────────────────────────────────────────────

function TipApplicationPage1() {
  const { sizing, etching } = tipApplicationContent
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={tipApplicationContent.sectionNumber}
        sectionLabel={tipApplicationContent.sectionLabel}
        title={tipApplicationContent.title}
      />

      <TextBlock heading={sizing.heading} body="Correct tip sizing is the most underestimated step in Gel-X application. A perfectly sized tip is the foundation of long-lasting retention." />
      <BulletList variant="check" items={sizing.items} />
      <CalloutBox variant={sizing.callout.variant} content={sizing.callout.content} />

      <Divider spacing="md" />

      <TextBlock heading={etching.heading} body={etching.intro} />

      <SplitLayout
        split="50/50"
        leftContent={
          <View
            style={{
              backgroundColor: colors.gray100,
              padding: 16,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              {etching.chemical.title}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.gray900,
                lineHeight: 1.6,
                fontFamily: 'Helvetica',
              }}
            >
              {etching.chemical.text}
            </Text>
          </View>
        }
        rightContent={
          <View
            style={{
              backgroundColor: colors.gray100,
              padding: 16,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              {etching.efile.title}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: colors.gray900,
                lineHeight: 1.6,
                fontFamily: 'Helvetica',
              }}
            >
              {etching.efile.text}
            </Text>
          </View>
        }
      />

      <CalloutBox variant={etching.callout.variant} content={etching.callout.content} />

      <PageFooter pageNumber={10} />
    </Page>
  )
}

function TipApplicationPage2() {
  const { gelApplication, placement } = tipApplicationContent
  return (
    <Page size="A4" style={pageStyle}>
      <TextBlock
        heading={gelApplication.heading}
        body="The amount of gel applied inside the tip is a critical variable. Too little creates weak spots; too much causes flooding and cuticle lifting."
      />
      <BulletList variant="number" items={gelApplication.items} />

      {/* Three-column gel amount comparison */}
      <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16 }}>
        {gelApplication.amounts.map((amount, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              backgroundColor: index === 2 ? colors.warmLight : colors.gray100,
              padding: 14,
              borderRadius: 4,
              borderTopWidth: 2,
              borderTopColor: index === 0 ? '#E53E3E' : index === 1 ? colors.champagneDark : colors.champagne,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontFamily: 'Helvetica-Bold',
                color: index === 0 ? '#C53030' : index === 1 ? colors.champagneDark : colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              {amount.label}
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: colors.gray900,
                lineHeight: 1.55,
                fontFamily: 'Helvetica',
              }}
            >
              {amount.effect}
            </Text>
          </View>
        ))}
      </View>

      <CalloutBox variant={gelApplication.callout.variant} content={gelApplication.callout.content} />

      <Divider spacing="md" />

      <TextBlock heading={placement.heading} body="Placement technique and curing discipline are the final variables in the retention equation. Consistency here separates average results from professional-grade retention." />
      <BulletList variant="number" items={placement.items} />
      <CalloutBox variant={placement.callout.variant} content={placement.callout.content} />

      <PageFooter pageNumber={11} />
    </Page>
  )
}

// ─── ANTI-LIFTING PAGES ───────────────────────────────────────────────────────

function AntiLiftingPage1() {
  const causes = antiLiftingCauses.slice(0, 4)
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber="04"
        sectionLabel="ANTI-LIFTING"
        title="Every Cause. Every Fix."
      />

      {causes.map((cause, index) => (
        <View key={index}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Helvetica-Bold',
                  color: colors.champagne,
                  marginRight: 8,
                }}
              >
                {cause.number}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Helvetica-Bold',
                  color: colors.black,
                }}
              >
                {cause.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.gray600, marginRight: 6 }}>WHAT IT IS</Text>
              <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{cause.whatItIs}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.gray600, marginRight: 6 }}>WHY IT LIFTS</Text>
              <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{cause.whyItLifts}</Text>
            </View>
            <View>
              {cause.howToPrevent.map((tip, tipIndex) => (
                <View key={tipIndex} style={{ flexDirection: 'row', marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: colors.champagne, marginRight: 8, fontFamily: 'Helvetica' }}>→</Text>
                  <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
          {index < causes.length - 1 && <Divider spacing="sm" variant="line" />}
        </View>
      ))}

      <PageFooter pageNumber={13} />
    </Page>
  )
}

function AntiLiftingPage2() {
  const causes = antiLiftingCauses.slice(4, 8)
  return (
    <Page size="A4" style={pageStyle}>
      {causes.map((cause, index) => (
        <View key={index}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Helvetica-Bold',
                  color: colors.champagne,
                  marginRight: 8,
                }}
              >
                {cause.number}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Helvetica-Bold',
                  color: colors.black,
                }}
              >
                {cause.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.gray600, marginRight: 6 }}>WHAT IT IS</Text>
              <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{cause.whatItIs}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.gray600, marginRight: 6 }}>WHY IT LIFTS</Text>
              <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{cause.whyItLifts}</Text>
            </View>
            <View>
              {cause.howToPrevent.map((tip, tipIndex) => (
                <View key={tipIndex} style={{ flexDirection: 'row', marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: colors.champagne, marginRight: 8, fontFamily: 'Helvetica' }}>→</Text>
                  <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
          {index < causes.length - 1 && <Divider spacing="sm" variant="line" />}
        </View>
      ))}

      <PageFooter pageNumber={14} />
    </Page>
  )
}

function AntiLiftingPage3() {
  const causes = antiLiftingCauses.slice(8, 12)
  return (
    <Page size="A4" style={pageStyle}>
      {causes.map((cause, index) => (
        <View key={index}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Helvetica-Bold',
                  color: colors.champagne,
                  marginRight: 8,
                }}
              >
                {cause.number}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Helvetica-Bold',
                  color: colors.black,
                }}
              >
                {cause.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.gray600, marginRight: 6 }}>WHAT IT IS</Text>
              <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{cause.whatItIs}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.gray600, marginRight: 6 }}>WHY IT LIFTS</Text>
              <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{cause.whyItLifts}</Text>
            </View>
            <View>
              {cause.howToPrevent.map((tip, tipIndex) => (
                <View key={tipIndex} style={{ flexDirection: 'row', marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: colors.champagne, marginRight: 8, fontFamily: 'Helvetica' }}>→</Text>
                  <Text style={{ fontSize: 9, color: colors.gray900, fontFamily: 'Helvetica', flex: 1, lineHeight: 1.5 }}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
          {index < causes.length - 1 && <Divider spacing="sm" variant="line" />}
        </View>
      ))}

      <Divider spacing="md" />
      <CalloutBox variant={antiLiftingSectionCallout.variant} content={antiLiftingSectionCallout.content} />

      <PageFooter pageNumber={15} />
    </Page>
  )
}

// ─── RETENTION PROTOCOL PAGES ─────────────────────────────────────────────────

function RetentionProtocolPage() {
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={retentionProtocolContent.sectionNumber}
        sectionLabel={retentionProtocolContent.sectionLabel}
        title={retentionProtocolContent.title}
      />

      <SplitLayout
        split="50/50"
        leftContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 14,
              }}
            >
              PREP PHASE
            </Text>
            {retentionProtocolContent.prepPhase.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
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
                    fontSize: 10,
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
        }
        rightContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 14,
              }}
            >
              APPLICATION PHASE
            </Text>
            {retentionProtocolContent.applicationPhase.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
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
                    fontSize: 10,
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
        }
      />

      <CalloutBox
        variant={retentionProtocolContent.callout.variant}
        content={retentionProtocolContent.callout.content}
      />

      <PageFooter pageNumber={18} />
    </Page>
  )
}

// ─── COMMON MISTAKES PAGE ─────────────────────────────────────────────────────

function CommonMistakesPage() {
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={commonMistakesContent.sectionNumber}
        sectionLabel={commonMistakesContent.sectionLabel}
        title={commonMistakesContent.title}
      />

      <SplitLayout
        split="50/50"
        leftContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.gray600,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 14,
              }}
            >
              BEGINNER MISTAKES
            </Text>
            <BulletList variant="dash" items={commonMistakesContent.beginner} />
          </View>
        }
        rightContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagneDark,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 14,
              }}
            >
              ADVANCED / HIDDEN MISTAKES
            </Text>
            <BulletList variant="dash" items={commonMistakesContent.advanced} />
          </View>
        }
      />

      <PageFooter pageNumber={20} />
    </Page>
  )
}

// ─── PRO TIPS PAGE ────────────────────────────────────────────────────────────

function ProTipsPage() {
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={proTipsContent.sectionNumber}
        sectionLabel={proTipsContent.sectionLabel}
        title={proTipsContent.title}
      />

      <BulletList variant="check" items={proTipsContent.tips} />

      <PageFooter pageNumber={21} />
    </Page>
  )
}

// ─── AFTERCARE PAGE ───────────────────────────────────────────────────────────

function AftercarePage() {
  return (
    <Page size="A4" style={pageStyle}>
      <SectionHeader
        sectionNumber={aftercareContent.sectionNumber}
        sectionLabel={aftercareContent.sectionLabel}
        title={aftercareContent.title}
      />

      <SplitLayout
        split="50/50"
        leftContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: colors.champagne,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 14,
              }}
            >
              WHAT TO DO
            </Text>
            <BulletList variant="check" items={aftercareContent.whatToDo} />
          </View>
        }
        rightContent={
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: '#C53030',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 14,
              }}
            >
              WHAT RUINS RETENTION
            </Text>
            <BulletList variant="dash" items={aftercareContent.whatRuins} />
          </View>
        }
      />

      <Divider spacing="md" />

      <View
        style={{
          backgroundColor: colors.gray100,
          padding: 20,
          borderRadius: 4,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: colors.gray600,
            fontFamily: 'Helvetica',
            lineHeight: 1.65,
            fontStyle: 'italic',
          }}
        >
          {aftercareContent.note}
        </Text>
      </View>

      <PageFooter pageNumber={22} />
    </Page>
  )
}

// ─── MYTHS VS FACTS PAGE ──────────────────────────────────────────────────────

function MythsVsFactsPage() {
  return (
    <Page size="A4" style={pageStyle}>
      <View style={{ marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: 3,
            color: colors.champagne,
            fontFamily: 'Helvetica-Bold',
            marginBottom: 8,
          }}
        >
          RETENTION
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Myths vs Facts
        </Text>
        <View style={{ height: 0.5, backgroundColor: colors.champagneLight, marginTop: 8 }} />
      </View>

      {/* Column headers */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <View style={{ flex: 1, paddingRight: 20 }}>
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              color: colors.gray400,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            MYTH
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.champagneLight, marginHorizontal: 16 }} />
        <View style={{ flex: 1, paddingLeft: 20 }}>
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Helvetica-Bold',
              color: colors.champagne,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            FACT
          </Text>
        </View>
      </View>

      <View style={{ height: 0.5, backgroundColor: colors.champagneLight, marginBottom: 4 }} />

      {mythsVsFacts.map((row, index) => (
        <View key={index}>
          <View style={{ flexDirection: 'row', paddingVertical: 16 }}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.gray600,
                  fontFamily: 'Helvetica',
                  lineHeight: 1.55,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{row.myth}&rdquo;
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.champagneLight, marginHorizontal: 16 }} />
            <View style={{ flex: 1, paddingLeft: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.black,
                  fontFamily: 'Helvetica-Bold',
                  lineHeight: 1.55,
                }}
              >
                {row.fact}
              </Text>
            </View>
          </View>
          <View style={{ height: 0.5, backgroundColor: colors.champagneLight }} />
        </View>
      ))}

      <PageFooter pageNumber={23} />
    </Page>
  )
}

// ─── FULL CHECKLIST PAGE ──────────────────────────────────────────────────────

function FullChecklistPage() {
  return (
    <Page size="A4" style={pageStyle}>
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'Helvetica-Bold',
            color: colors.black,
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          {fullChecklistContent.title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.gray600,
            fontFamily: 'Helvetica',
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {fullChecklistContent.subtitle}
        </Text>
        <View style={{ height: 0.5, backgroundColor: colors.champagneLight }} />
      </View>

      <ChecklistBlock sections={fullChecklistContent.sections} />

      <PageFooter pageNumber={24} />
    </Page>
  )
}

// ─── CLOSING PAGE ─────────────────────────────────────────────────────────────

function ClosingPage() {
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
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 8,
            color: colors.champagne,
            letterSpacing: 4,
            textTransform: 'uppercase',
            fontFamily: 'Helvetica',
            marginBottom: 32,
          }}
        >
          VYNL ACADEMY
        </Text>

        <Text
          style={{
            fontSize: 28,
            fontFamily: 'Helvetica-Bold',
            color: colors.white,
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          You now have the complete system.
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: colors.champagneLight,
            fontFamily: 'Helvetica',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: 40,
          }}
        >
          3–4 week retention isn&apos;t a secret — it&apos;s a standard.
        </Text>

        {/* Thin champagne rule */}
        <View
          style={{
            width: 200,
            height: 0.5,
            backgroundColor: colors.champagne,
            marginBottom: 40,
          }}
        />

        <Text
          style={{
            fontSize: 10,
            color: colors.gray400,
            fontFamily: 'Helvetica',
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          Ready to go further? Join the full Gel-X Masterclass at
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.champagne,
            fontFamily: 'Helvetica-Bold',
            textAlign: 'center',
            marginBottom: 60,
          }}
        >
          vynlacademy.com
        </Text>

        <Text
          style={{
            fontSize: 8,
            color: colors.gray600,
            fontFamily: 'Helvetica',
            textAlign: 'center',
          }}
        >
          © 2025 Vynl Academy. All rights reserved.
        </Text>
      </View>
    </Page>
  )
}

// ─── ROOT DOCUMENT ────────────────────────────────────────────────────────────

export function GelXGuidePDF() {
  return (
    <Document
      title="The Gel-X Retention Mastery Guide"
      author="Vynl Academy"
      subject="Professional Gel-X Application Techniques"
      creator="Vynl Academy"
      producer="Vynl Academy"
    >
      {/* Page 1: Cover */}
      <CoverPage />

      {/* Page 2: Table of Contents */}
      <TableOfContentsPage />

      {/* Page 3: Introduction */}
      <IntroductionPage />

      {/* Pages 4–5: Nail Science */}
      <NailSciencePage1 />
      <NailSciencePage2 />

      {/* Pages 6–9: Prep System */}
      <PrepSystemPage1 />
      <PrepSystemPage2 />
      <PrepSystemPage3 />

      {/* Pages 10–12: Tip Application */}
      <TipApplicationPage1 />
      <TipApplicationPage2 />

      {/* Pages 13–17: Anti-Lifting Masterclass */}
      <AntiLiftingPage1 />
      <AntiLiftingPage2 />
      <AntiLiftingPage3 />

      {/* Pages 18–19: Retention Protocol */}
      <RetentionProtocolPage />

      {/* Page 20: Common Mistakes */}
      <CommonMistakesPage />

      {/* Page 21: Pro Tips */}
      <ProTipsPage />

      {/* Page 22: Aftercare */}
      <AftercarePage />

      {/* Page 23: Myths vs Facts */}
      <MythsVsFactsPage />

      {/* Page 24: Full Checklist */}
      <FullChecklistPage />

      {/* Page 25: Closing */}
      <ClosingPage />
    </Document>
  )
}
