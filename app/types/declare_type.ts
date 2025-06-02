export interface DeclareType {
  hotelName: string
  roomName: string
  price: number
  details: string[]
  dataCrawl: string[]
  expediaPrice: string[]
}

export interface RabbitMqConfig {
  user: string
  password: string
  hostname: string
  port: number
  protocol: 'amqp://' | 'amqps://'
}

export interface PriceFormatType {
  title: string
  start: number
  className: string
}
