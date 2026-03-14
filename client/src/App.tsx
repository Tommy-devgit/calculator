import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Operator = '+' | '-' | '*' | '/'

const operatorLabels: Record<Operator, string> = {
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
}

const formatDisplayValue = (raw: string) => {
  if (raw === 'Error') return raw
  if (raw === '-') return raw

  const isNegative = raw.startsWith('-')
  const unsigned = isNegative ? raw.slice(1) : raw
  const [integerPart, decimalPart] = unsigned.split('.')
  const withGrouping = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const signed = isNegative ? `-${withGrouping}` : withGrouping

  if (decimalPart !== undefined) {
    return `${signed}.${decimalPart}`
  }

  return signed
}

function App() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)
  const [overwrite, setOverwrite] = useState(false)

  const history = useMemo(() => {
    if (previousValue === null || operator === null) return ''
    return `${previousValue} ${operatorLabels[operator]}`
  }, [previousValue, operator])

  const resetAll = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperator(null)
    setOverwrite(false)
  }

  const inputDigit = (digit: string) => {
    if (display === 'Error') {
      setDisplay(digit)
      setOverwrite(false)
      return
    }
    if (overwrite) {
      setDisplay(digit)
      setOverwrite(false)
      return
    }
    if (display === '0') {
      setDisplay(digit)
      return
    }
    setDisplay((current) => current + digit)
  }

  const inputDot = () => {
    if (display === 'Error') {
      setDisplay('0.')
      setOverwrite(false)
      return
    }
    if (overwrite) {
      setDisplay('0.')
      setOverwrite(false)
      return
    }
    if (display.includes('.')) return
    setDisplay((current) => current + '.')
  }

  const backspace = () => {
    if (display === 'Error') {
      setDisplay('0')
      setOverwrite(false)
      return
    }
    if (overwrite) {
      setDisplay('0')
      setOverwrite(false)
      return
    }
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0')
      return
    }
    setDisplay((current) => current.slice(0, -1))
  }

  const toggleSign = () => {
    if (display === 'Error') {
      setDisplay('0')
      setOverwrite(false)
      return
    }
    if (display === '0') return
    if (display.startsWith('-')) {
      setDisplay(display.slice(1))
      return
    }
    setDisplay(`-${display}`)
  }

  const applyPercent = () => {
    if (display === 'Error') {
      setDisplay('0')
      setOverwrite(false)
      return
    }
    const currentValue = Number(display)
    if (Number.isNaN(currentValue)) return
    setDisplay(String(currentValue / 100))
    setOverwrite(true)
  }

  const compute = (left: number, right: number, op: Operator) => {
    if (op === '+') return left + right
    if (op === '-') return left - right
    if (op === '*') return left * right
    if (op === '/') return right === 0 ? null : left / right
    return null
  }

  const handleOperator = (nextOperator: Operator) => {
    if (display === 'Error') return
    const currentValue = Number(display)
    if (Number.isNaN(currentValue)) return

    if (previousValue === null) {
      setPreviousValue(currentValue)
      setOperator(nextOperator)
      setOverwrite(true)
      return
    }

    if (operator && !overwrite) {
      const result = compute(previousValue, currentValue, operator)
      if (result === null) {
        setDisplay('Error')
        setPreviousValue(null)
        setOperator(null)
        setOverwrite(true)
        return
      }
      setPreviousValue(result)
      setDisplay(String(result))
      setOperator(nextOperator)
      setOverwrite(true)
      return
    }

    setOperator(nextOperator)
    setOverwrite(true)
  }

  const evaluate = () => {
    if (display === 'Error') return
    if (previousValue === null || operator === null) return
    const currentValue = Number(display)
    if (Number.isNaN(currentValue)) return

    const result = compute(previousValue, currentValue, operator)
    if (result === null) {
      setDisplay('Error')
    } else {
      setDisplay(String(result))
    }
    setPreviousValue(null)
    setOperator(null)
    setOverwrite(true)
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const { key } = event

      if (key >= '0' && key <= '9') {
        event.preventDefault()
        inputDigit(key)
        return
      }

      if (key === '.') {
        event.preventDefault()
        inputDot()
        return
      }

      if (key === 'Backspace') {
        event.preventDefault()
        backspace()
        return
      }

      if (key === 'Escape') {
        event.preventDefault()
        resetAll()
        return
      }

      if (key === '+' || key === '-' || key === '*' || key === '/') {
        event.preventDefault()
        handleOperator(key as Operator)
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
  }, [display, previousValue, operator, overwrite])

  return (
    <div className="app">
      <div className="calculator">
        <header className="calc-header">
          <div>
            <p className="eyebrow">Desktop Calculator</p>
            <h1>Orbit</h1>
          </div>
          <div className="status">
            <span>{operator ? operatorLabels[operator] : 'Ready'}</span>
            <span className="dot"></span>
          </div>
        </header>

        <section className="display">
          <p className="history">{history || '\u00A0'}</p>
          <div className="value" aria-live="polite">
            {formatDisplayValue(display)}
          </div>
        </section>

        <section className="keypad" aria-label="Calculator keypad">
          <button className="key key--utility" onClick={resetAll}>
            AC
          </button>
          <button className="key key--utility" onClick={toggleSign}>
            +/-
          </button>
          <button className="key key--utility" onClick={applyPercent}>
            %
          </button>
          <button
            className="key key--operator"
            onClick={() => handleOperator('/')}
          >
            /
          </button>

          <button className="key" onClick={() => inputDigit('7')}>
            7
          </button>
          <button className="key" onClick={() => inputDigit('8')}>
            8
          </button>
          <button className="key" onClick={() => inputDigit('9')}>
            9
          </button>
          <button
            className="key key--operator"
            onClick={() => handleOperator('*')}
          >
            *
          </button>

          <button className="key" onClick={() => inputDigit('4')}>
            4
          </button>
          <button className="key" onClick={() => inputDigit('5')}>
            5
          </button>
          <button className="key" onClick={() => inputDigit('6')}>
            6
          </button>
          <button
            className="key key--operator"
            onClick={() => handleOperator('-')}
          >
            -
          </button>

          <button className="key" onClick={() => inputDigit('1')}>
            1
          </button>
          <button className="key" onClick={() => inputDigit('2')}>
            2
          </button>
          <button className="key" onClick={() => inputDigit('3')}>
            3
          </button>
          <button
            className="key key--operator"
            onClick={() => handleOperator('+')}
          >
            +
          </button>

          <button className="key key--wide" onClick={() => inputDigit('0')}>
            0
          </button>
          <button className="key" onClick={inputDot}>
            .
          </button>
          <button className="key key--equals" onClick={evaluate}>
            =
          </button>
        </section>

        <div className="footer">
          <span>Keys: 0-9, +, -, *, /, Enter, Esc</span>
          <span>Backspace = delete</span>
        </div>
      </div>
    </div>
  )
}

export default App
