import Downshift from "downshift"
import { useCallback, useEffect, useRef, useState } from "react"
import classNames from "classnames"
import {
  DropdownPosition,
  GetDropdownPositionFn,
  InputSelectOnChange,
  InputSelectProps,
} from "./types"

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel,
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(defaultValue ?? null)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 })
  const inputRef = useRef<HTMLDivElement | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (selectedItem === null) return
      consumerOnChange(selectedItem)
      setSelectedValue(selectedItem)
    },
    [consumerOnChange]
  )

  // Update dropdown position on scroll/resize
  useEffect(() => {

    // Making sure that this logic only runs when dropdown is open
    if (!isDropdownOpen) return

    // Grabs a reference to the input element via inputRef.current 
    const updatePosition = () => {
      if (inputRef.current) {
        setDropdownPosition(getDropdownPosition(inputRef.current))
      }
    }

    // listens to scroll events so if the input movves the dropdown will follow
    window.addEventListener("scroll", updatePosition)
    window.addEventListener("resize", updatePosition)

    // need to call this immediately 
    updatePosition()

    return () => {
      // When the dropdown closes or componenet unmounts then it will remove the event listener to prevent memory leaks
      window.removeEventListener("scroll", updatePosition)
      window.removeEventListener("resize", updatePosition)
    }
  }, [isDropdownOpen])

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
      onStateChange={({ isOpen }) => {
        setIsDropdownOpen(isOpen ?? false)
      }}
    >
      {({
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
        selectedItem,
        getToggleButtonProps,
        inputValue,
      }) => {
        const toggleProps = getToggleButtonProps()
        const parsedSelectedItem = selectedItem === null ? null : parseItem(selectedItem)

        return (
          <div className="RampInputSelect--root">
            <label className="RampText--s RampText--hushed" {...getLabelProps()}>
              {label}
            </label>
            <div className="RampBreak--xs" />
            <div
              className="RampInputSelect--input"
              ref={inputRef}
              onClick={(event) => {
                setDropdownPosition(getDropdownPosition(event.currentTarget))
                toggleProps.onClick(event)
              }}
            >
              {inputValue || parsedSelectedItem?.label || "Select..."}
            </div>

            <div
              className={classNames("RampInputSelect--dropdown-container", {
                "RampInputSelect--dropdown-container-opened": isOpen,
              })}
              {...getMenuProps()}
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                position: "absolute",
                zIndex: 1000,
              }}
            >
              {renderItems()}
            </div>
          </div>
        )

        function renderItems() {
          if (!isOpen) return null
          if (isLoading) return <div className="RampInputSelect--dropdown-item">{loadingLabel}...</div>
          if (items.length === 0) return <div className="RampInputSelect--dropdown-item">No items</div>

          return items.map((item, index) => {
            const parsedItem = parseItem(item)
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  key: parsedItem.value,
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted": highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected":
                      parsedSelectedItem?.value === parsedItem.value,
                  }),
                })}
              >
                {parsedItem.label}
              </div>
            )
          })
        }
      }}
    </Downshift>
  )
}

const getDropdownPosition: GetDropdownPositionFn = (target) => {
  if (target instanceof Element) {
    const { top, left, height } = target.getBoundingClientRect()
    const { scrollY } = window
    return {
      top: scrollY + top + height,
      left,
    }
  }

  return { top: 0, left: 0 }
}
