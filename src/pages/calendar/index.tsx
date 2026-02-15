const MONTHS = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
const DAYS = ["T2", "T4", "T6"];

export default function CalendarPage() {
  return (
    <div className="flex">
      <div className="flex flex-col">
        {DAYS.map((day) => (
          <span>{day}</span>
        ))}
      </div>
      <div>
        <div className="flex items-center">
          {MONTHS.map((month) => (
            <span>{month}</span>
          ))}
        </div>
        <div></div>
      </div>
    </div>
  )
}
