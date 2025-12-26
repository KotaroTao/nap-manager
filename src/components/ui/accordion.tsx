"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
}

const AccordionContext = React.createContext<AccordionContextValue>({
  value: undefined,
  onValueChange: () => {},
})

interface AccordionProps {
  type?: "single" | "multiple"
  collapsible?: boolean
  value?: string
  onValueChange?: (value: string | undefined) => void
  defaultValue?: string
  children: React.ReactNode
  className?: string
}

function Accordion({
  type = "single",
  collapsible = false,
  value: controlledValue,
  onValueChange,
  defaultValue,
  children,
  className,
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue
  )
  const value = controlledValue ?? internalValue

  const handleValueChange = React.useCallback(
    (newValue: string | undefined) => {
      if (collapsible && value === newValue) {
        newValue = undefined
      }
      setInternalValue(newValue)
      onValueChange?.(newValue)
    },
    [value, collapsible, onValueChange]
  )

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <div className={cn("border-b", className)} data-value={value}>
      {children}
    </div>
  )
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { value, onValueChange } = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = value === itemValue

  return (
    <div className="flex">
      <button
        type="button"
        onClick={() => onValueChange(itemValue)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
          className
        )}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
    </div>
  )
}

const AccordionItemContext = React.createContext<string>("")

function AccordionItemWrapper({ value, children, className }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={value}>
      <AccordionItem value={value} className={className}>
        {children}
      </AccordionItem>
    </AccordionItemContext.Provider>
  )
}

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

function AccordionContent({ children, className }: AccordionContentProps) {
  const { value } = React.useContext(AccordionContext)
  const itemValue = React.useContext(AccordionItemContext)
  const isOpen = value === itemValue

  if (!isOpen) return null

  return (
    <div className="overflow-hidden text-sm">
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  )
}

export {
  Accordion,
  AccordionItemWrapper as AccordionItem,
  AccordionTrigger,
  AccordionContent,
}
