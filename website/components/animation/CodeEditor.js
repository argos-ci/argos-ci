import { x } from '@xstyled/styled-components'
import { useAnimationFrame } from 'framer-motion'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { ControlButtons } from './ControlButtons'

const Tab = ({ children, active, ...props }) => {
  return (
    <x.div
      borderRadius="5px 5px 0 0"
      borderColor="border"
      borderBottomColor="editor-background"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      gap={3}
      borderWidth={1}
      px="16px"
      py="10px"
      fontSize="12px"
      mb="-10px"
      ml="80px"
      transition="1000ms"
      color={active ? 'border' : 'white'}
      {...props}
    >
      {children}

      {active ? (
        <x.div as={FaTimes} w="8px" />
      ) : (
        <x.div borderRadius="full" backgroundColor="gray-100" w="8px" h="8px" />
      )}
    </x.div>
  )
}

const Header = (props) => (
  <x.div
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    h="45px"
    borderBottom={1}
    borderColor="border"
    pr="12px"
    {...props}
  />
)

const Body = (props) => (
  <x.div display="flex" fontSize="15px" h={1} lineHeight="24px" {...props} />
)

const RowNumbers = ({ length = 20, ...props }) => (
  <x.div
    color="#49657a"
    display="flex"
    flexDirection="column"
    alignItems="center"
    px="6px"
    w="24px"
    backgroundColor="body-background"
    pt="12px"
    {...props}
  >
    {Array.from({ length }, (_, i) => (
      <div key={i}>{i + 1}</div>
    ))}
  </x.div>
)

const Code = (props) => (
  <x.pre p="13px 12px 12px" color="white" flex="auto" {...props} />
)

function trimLastChar(typedText, editableLines = []) {
  const lines = typedText.split('\n')
  const filledEditableLines = editableLines.filter(
    (lineIndex) => !lines[lineIndex].match(/^\s+$/),
  )
  if (filledEditableLines.length === 0) return typedText
  return lines
    .map((line, index) =>
      index === filledEditableLines[0] ? line.slice(0, -1) : line,
    )
    .join('\n')
}

const trimLines = (text, lineIndexes) =>
  text
    .split('\n')
    .filter((_, index) => !lineIndexes.includes(index))
    .join('\n')

const useTyping = ({ text, linesToTrim = [], typingSpeed = 90, onSave }) => {
  let lastSavedTime = useRef(0)
  const callbackTriggered = useRef(false)

  const [textToType, setTextToType] = useState(text)
  const [typedText, setTypedText] = useState('')

  const isTypingOver = (formattedCode) => formattedCode === textToType
  const isNextCharTime = (time) => !(time - lastSavedTime.current < typingSpeed)

  useEffect(() => {
    if (linesToTrim.length > 0) {
      setTextToType((prev) => trimLines(String(prev), linesToTrim))
      lastSavedTime.current = 0
      callbackTriggered.current = false
    }
  }, [linesToTrim])

  useAnimationFrame((time) => {
    lastSavedTime.current ||= time
    const formattedCode = typedText.replaceAll(/\n\s*\n/g, '\n')

    if (isTypingOver(formattedCode)) {
      if (callbackTriggered.current) return
      callbackTriggered.current = true
      setTypedText(formattedCode)
      return setTimeout(() => onSave(formattedCode), 800)
    }

    if (isNextCharTime(time)) {
      lastSavedTime.current = time
      return linesToTrim.length === 0
        ? setTypedText((prev) => `${prev}${textToType[prev.length]}`)
        : setTypedText((prev) => trimLastChar(prev, linesToTrim))
    }
  })

  return typedText
}

export const CodeEditor = forwardRef(
  ({ children, linesToTrim = [], onSave, ...props }, ref) => {
    const typedText = useTyping({ text: children, linesToTrim, onSave })

    return (
      <x.div position="absolute" ref={ref} {...props}>
        <x.div
          borderRadius="md"
          boxShadow="md"
          border={1}
          borderColor="border"
          backgroundColor="editor-background"
          overflow="hidden"
          position="relative"
          h="230px"
        >
          <Header>
            <ControlButtons />
            <Tab active={false}>style.css</Tab>
          </Header>

          <Body w={1}>
            <RowNumbers length={20} />
            <Code>{typedText}</Code>
          </Body>
        </x.div>
      </x.div>
    )
  },
)
