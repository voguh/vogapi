export default class DateUtils {
  public static betweenString(start: Date, end: Date): string {
    let diff = Math.abs(end.getTime() - start.getTime())
    const diffYears = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))
    diff -= diffYears * (1000 * 60 * 60 * 24 * 365)
    const diffMonths = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
    diff -= diffMonths * (1000 * 60 * 60 * 24 * 30)
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
    diff -= diffDays * (1000 * 60 * 60 * 24)
    const diffHours = Math.floor(diff / (1000 * 60 * 60))
    diff -= diffHours * (1000 * 60 * 60)
    const diffMinutes = Math.floor(diff / (1000 * 60))
    diff -= diffMinutes * (1000 * 60)
    const diffSeconds = Math.floor(diff / 1000)

    const labels = []

    if (diffYears > 0) {
      if (diffYears === 1) {
        labels.push(`${diffYears} year`)
      } else {
        labels.push(`${diffYears} years`)
      }
    }

    if (diffMonths > 0) {
      if (diffMonths === 1) {
        labels.push(`${diffMonths} month`)
      } else {
        labels.push(`${diffMonths} months`)
      }
    }

    if (diffDays > 0) {
      if (diffDays === 1) {
        labels.push(`${diffDays} day`)
      } else {
        labels.push(`${diffDays} days`)
      }
    }

    if (diffHours > 0) {
      if (diffHours === 1) {
        labels.push(`${diffHours} hour`)
      } else {
        labels.push(`${diffHours} hours`)
      }
    }

    if (diffMinutes > 0) {
      if (diffMinutes === 1) {
        labels.push(`${diffMinutes} minute`)
      } else {
        labels.push(`${diffMinutes} minutes`)
      }
    }

    if (diffSeconds > 0) {
      if (diffSeconds === 1) {
        labels.push(`${diffSeconds} second`)
      } else {
        labels.push(`${diffSeconds} seconds`)
      }
    }

    return labels.join(', ')
  }
}
