import { useEffect, useMemo, useState } from 'react'
import './App.css'

type AngleMode = 'DEG' | 'RAD'

type HistoryEntry = {
  expression: string
  result: string
}

const operatorPrecedence: Record<string, number> = {
  '+': 2,
  '-': 2,
  '*': 3,
  '/': 3,
  '^': 4,
}

const rightAssociative = new Set(['^'])
const functions = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sqrt',
  'log',
  'ln',
  'neg',
  'inv',
])

const constants: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return 'Error'
  const asString = value.toString()
  if (Math.abs(value) >= 1e10 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(6)
  }
  return asString
}

const toRadians = (value: number, mode: AngleMode) =>
  mode === 'DEG' ? (value * Math.PI) / 180 : value

const fromRadians = (value: number, mode: AngleMode) =>
  mode === 'DEG' ? (value * 180) / Math.PI : value

const tokenize = (input: string) => {
  const tokens: string[] = []
  let current = ''

  const flush = () => {
    if (current) {
      tokens.push(current)
      current = ''
    }
  }

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (char === ' ') continue

    if (/[0-9.]/.test(char)) {
      current += char
      continue
    }

    if (/[a-z]/i.test(char)) {
      current += char
      continue
    }

    flush()
    tokens.push(char)
  }

  flush()
  return tokens
}

const toRpn = (tokens: string[]) => {
  const output: string[] = []
  const stack: string[] = []

  const isOperator = (token: string) => ['+', '-', '*', '/', '^'].includes(token)

  tokens.forEach((token, index) => {
    const prev = index > 0 ? tokens[index - 1] : ''
    const isUnaryMinus = token === '-' && (index === 0 || prev === '(' || isOperator(prev))

    if (isUnaryMinus) {
      stack.push('neg')
      return
    }

    if (!Number.isNaN(Number(token))) {
      output.push(token)
      return
    }

    if (token in constants) {
      output.push(constants[token].toString())
      return
    }

    if (functions.has(token)) {
      stack.push(token)
      return
    }

    if (isOperator(token)) {
      while (stack.length > 0) {
        const top = stack[stack.length - 1]
        if (functions.has(top)) {
          output.push(stack.pop() as string)
          continue
        }
        if (
          isOperator(top) &&
          (operatorPrecedence[top] > operatorPrecedence[token] ||
            (operatorPrecedence[top] === operatorPrecedence[token] &&
              !rightAssociative.has(token)))
        ) {
          output.push(stack.pop() as string)
          continue
        }
        break
      }
      stack.push(token)
      return
    }

    if (token === '(') {
      stack.push(token)
      return
    }

    if (token === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        output.push(stack.pop() as string)
      }
      stack.pop()
      if (stack.length > 0 && functions.has(stack[stack.length - 1])) {
        output.push(stack.pop() as string)
      }
    }
  })

  while (stack.length > 0) {
    output.push(stack.pop() as string)
  }

  return output
}

const evaluateRpn = (tokens: string[], mode: AngleMode) => {
  const stack: number[] = []

  tokens.forEach((token) => {
    if (!Number.isNaN(Number(token))) {
      stack.push(Number(token))
      return
    }

    if (functions.has(token)) {
      const value = stack.pop()
      if (value === undefined) return
      if (token === 'neg') stack.push(-value)
      else if (token === 'inv') stack.push(1 / value)
      else if (token === 'sqrt') stack.push(Math.sqrt(value))
      else if (token === 'log') stack.push(Math.log10(value))
      else if (token === 'ln') stack.push(Math.log(value))
      else if (token === 'sin') stack.push(Math.sin(toRadians(value, mode)))
      else if (token === 'cos') stack.push(Math.cos(toRadians(value, mode)))
      else if (token === 'tan') stack.push(Math.tan(toRadians(value, mode)))
      else if (token === 'asin') stack.push(fromRadians(Math.asin(value), mode))
      else if (token === 'acos') stack.push(fromRadians(Math.acos(value), mode))
      else if (token === 'atan') stack.push(fromRadians(Math.atan(value), mode))
      return
    }

    const right = stack.pop()
    const left = stack.pop()
    if (right === undefined || left === undefined) return
    if (token === '+') stack.push(left + right)
    else if (token === '-') stack.push(left - right)
    else if (token === '*') stack.push(left * right)
    else if (token === '/') stack.push(right === 0 ? NaN : left / right)
    else if (token === '^') stack.push(Math.pow(left, right))
  })

  return stack.length === 1 ? stack[0] : NaN
}

const evaluateExpression = (input: string, mode: AngleMode) => {
  const tokens = tokenize(input)
  const rpn = toRpn(tokens)
  return evaluateRpn(rpn, mode)
}

const applyToLastNumber = (expression: string, fn: (value: number) => number) => {
  const match = expression.match(/(-?\d*\.?\d+)(?!.*\d)/)
  if (!match || match.index === undefined) return expression
  const value = Number(match[1])
  if (Number.isNaN(value)) return expression
  const updated = fn(value)
  if (!Number.isFinite(updated)) return expression
  const before = expression.slice(0, match.index)
  const after = expression.slice(match.index + match[1].length)
  return `${before}${updated}${after}`
}

const addImplicitMultiply = (expression: string) => {
  if (!expression) return expression
  const lastChar = expression[expression.length - 1]
  if (/[0-9)\]]/.test(lastChar)) {
    return `${expression}*`
  }
  return expression
}

function App() {
  const [expression, setExpression] = useState('0')
  const [result, setResult] = useState('0')
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG')
  const [memory, setMemory] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const readyLabel = useMemo(
    () => (angleMode === 'DEG' ? 'Degrees' : 'Radians'),
    [angleMode]
  )

  const append = (value: string) => {
    setExpression((prev) => {
      if (prev === '0' && /[0-9.]/.test(value)) return value
      return prev + value
    })
  }

  const appendOperator = (operator: string) => {
    setExpression((prev) => {
      const trimmed = prev.trim()
      if (!trimmed) return operator
      if (/[+\-*/^]$/.test(trimmed)) {
        return trimmed.replace(/[+\-*/^]$/, operator)
      }
      return trimmed + operator
    })
  }

  const appendFunction = (fn: string) => {
    setExpression((prev) => {
      const next = addImplicitMultiply(prev)
      if (next === '0') return `${fn}(`
      return `${next}${fn}(`
    })
  }

  const appendConstant = (name: keyof typeof constants) => {
    setExpression((prev) => {
      const next = addImplicitMultiply(prev)
      if (next === '0') return name
      return `${next}${name}`
    })
  }

  const clearAll = () => {
    setExpression('0')
    setResult('0')
  }

  const backspace = () => {
    setExpression((prev) => {
      if (prev.length <= 1) return '0'
      return prev.slice(0, -1)
    })
  }

  const toggleSign = () => {
    setExpression((prev) => applyToLastNumber(prev, (value) => -value))
  }

  const applyPercent = () => {
    setExpression((prev) => applyToLastNumber(prev, (value) => value / 100))
  }

  const applyUnaryInline = (token: string) => {
    if (token === 'x^2') {
      setExpression((prev) => `${prev}^2`)
      return
    }
    if (token === '1/x') {
      setExpression((prev) => `${addImplicitMultiply(prev)}inv(`)
      return
    }
    if (token === 'sqrt') {
      appendFunction('sqrt')
      return
    }
    if (token === 'log') {
      appendFunction('log')
      return
    }
    if (token === 'ln') {
      appendFunction('ln')
      return
    }
    if (token === 'sin') {
      appendFunction('sin')
      return
    }
    if (token === 'cos') {
      appendFunction('cos')
      return
    }
    if (token === 'tan') {
      appendFunction('tan')
      return
    }
    if (token === 'asin') {
      appendFunction('asin')
      return
    }
    if (token === 'acos') {
      appendFunction('acos')
      return
    }
    if (token === 'atan') {
      appendFunction('atan')
    }
  }

  const evaluate = () => {
    const computed = evaluateExpression(expression, angleMode)
    const formatted = formatNumber(computed)
    setResult(formatted)
    if (formatted !== 'Error') {
      setHistory((prev) => [
        { expression, result: formatted },
        ...prev.slice(0, 18),
      ])
      setExpression(formatted)
    }
  }

  const memoryClear = () => setMemory(null)
  const memoryRecall = () => {
    if (memory === null) return
    setExpression((prev) => {
      const next = addImplicitMultiply(prev)
      if (next === '0') return formatNumber(memory)
      return `${next}${formatNumber(memory)}`
    })
  }
  const memoryAdd = () => {
    const computed = evaluateExpression(expression, angleMode)
    if (!Number.isFinite(computed)) return
    setMemory((prev) => (prev ?? 0) + computed)
  }
  const memorySubtract = () => {
    const computed = evaluateExpression(expression, angleMode)
    if (!Number.isFinite(computed)) return
    setMemory((prev) => (prev ?? 0) - computed)
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const { key } = event

      if (key >= '0' && key <= '9') {
        event.preventDefault()
        append(key)
        return
      }

      if (key === '.') {
        event.preventDefault()
        append('.')
        return
      }

      if (key === 'Backspace') {
        event.preventDefault()
        backspace()
        return
      }

      if (key === 'Escape') {
        event.preventDefault()
        clearAll()
        return
      }

      if (key === '(' || key === ')') {
        event.preventDefault()
        append(key)
        return
      }

      if (key === '+' || key === '-' || key === '*' || key === '/' || key === '^') {
        event.preventDefault()
        appendOperator(key)
        return
      }

      if (key === 'Enter' || key === '=') {
        event.preventDefault()
        evaluate()
      }

      if (key === '%') {
        event.preventDefault()
        applyPercent()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [expression, angleMode])

  return (
    <div className="app">
      <div className="calculator pro">
        <header className="calc-header">
          <div>
            <p className="eyebrow">Professional Desktop Calculator</p>
            <h1>Orbit Pro</h1>
          </div>
          <div className="status">
            <span>{readyLabel}</span>
            <button
              className="mode-toggle"
              onClick={() =>
                setAngleMode((mode) => (mode === 'DEG' ? 'RAD' : 'DEG'))
              }
            >
              {angleMode}
            </button>
          </div>
        </header>

        <section className="display">
          <p className="history-line">{expression || '\u00A0'}</p>
          <div className="value" aria-live="polite">
            {result}
          </div>
        </section>

        <div className="calc-body">
          <div className="pad">
            <section className="keypad keypad--scientific" aria-label="Scientific keypad">
              <button className="key key--utility" onClick={clearAll}>
                AC
              </button>
              <button className="key key--utility" onClick={toggleSign}>
                +/-
              </button>
              <button className="key key--utility" onClick={applyPercent}>
                %
              </button>
              <button className="key key--operator" onClick={() => appendOperator('^')}>
                x^y
              </button>

              <button className="key key--science" onClick={() => applyUnaryInline('sin')}>
                sin
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('cos')}>
                cos
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('tan')}>
                tan
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('sqrt')}>
                sqrt
              </button>

              <button className="key key--science" onClick={() => applyUnaryInline('asin')}>
                asin
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('acos')}>
                acos
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('atan')}>
                atan
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('x^2')}>
                x^2
              </button>

              <button className="key key--science" onClick={() => applyUnaryInline('1/x')}>
                1/x
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('log')}>
                log
              </button>
              <button className="key key--science" onClick={() => applyUnaryInline('ln')}>
                ln
              </button>
              <button className="key key--utility" onClick={backspace}>
                CE
              </button>

              <button className="key key--science" onClick={() => appendConstant('pi')}>
                pi
              </button>
              <button className="key key--science" onClick={() => appendConstant('e')}>
                e
              </button>
              <button className="key key--utility" onClick={() => append('(')}>
                (
              </button>
              <button className="key key--utility" onClick={() => append(')')}>
                )
              </button>

              <button className="key key--memory" onClick={memoryClear}>
                MC
              </button>
              <button className="key key--memory" onClick={memoryRecall}>
                MR
              </button>
              <button className="key key--memory" onClick={memoryAdd}>
                M+
              </button>
              <button className="key key--memory" onClick={memorySubtract}>
                M-
              </button>
            </section>

            <section className="keypad keypad--main" aria-label="Calculator keypad">
              <button className="key" onClick={() => append('7')}>
                7
              </button>
              <button className="key" onClick={() => append('8')}>
                8
              </button>
              <button className="key" onClick={() => append('9')}>
                9
              </button>
              <button className="key key--operator" onClick={() => appendOperator('/')}>
                /
              </button>

              <button className="key" onClick={() => append('4')}>
                4
              </button>
              <button className="key" onClick={() => append('5')}>
                5
              </button>
              <button className="key" onClick={() => append('6')}>
                6
              </button>
              <button className="key key--operator" onClick={() => appendOperator('*')}>
                *
              </button>

              <button className="key" onClick={() => append('1')}>
                1
              </button>
              <button className="key" onClick={() => append('2')}>
                2
              </button>
              <button className="key" onClick={() => append('3')}>
                3
              </button>
              <button className="key key--operator" onClick={() => appendOperator('-')}>
                -
              </button>

              <button className="key key--wide" onClick={() => append('0')}>
                0
              </button>
              <button className="key" onClick={() => append('.')}>
                .
              </button>
              <button className="key key--operator" onClick={() => appendOperator('+')}>
                +
              </button>
              <button className="key key--equals" onClick={evaluate}>
                =
              </button>
            </section>
          </div>

          <aside className="history-panel" aria-label="History tape">
            <div className="history-header">
              <span>History</span>
              <button className="history-clear" onClick={() => setHistory([])}>
                Clear
              </button>
            </div>
            <div className="history-list">
              {history.length === 0 && (
                <p className="history-empty">No calculations yet.</p>
              )}
              {history.map((entry, index) => (
                <button
                  className="history-item"
                  key={`${entry.expression}-${index}`}
                  onClick={() => {
                    setExpression(entry.result)
                    setResult(entry.result)
                  }}
                >
                  <span className="history-expression">{entry.expression}</span>
                  <span className="history-result">{entry.result}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <div className="footer">
          <span>Mode: {angleMode}</span>
          <span>Memory: {memory === null ? 'Empty' : formatNumber(memory)}</span>
        </div>
      </div>
    </div>
  )
}

export default App
