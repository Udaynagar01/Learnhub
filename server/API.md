# LearnHub API (`/api/v1`)

## Auth (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register student |
| POST | `/auth/login` | — | Login |
| POST | `/auth/logout` | — | Clear refresh cookie |
| POST | `/auth/refresh` | cookie | New access token |
| GET | `/auth/me` | Bearer | Current user |

## User
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/profile` | Bearer | Update name/avatar |
| PATCH | `/password` | Bearer | Change password |

## Courses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | List categories |
| GET | `/courses` | List (`q`, `category`, `sort`, `page`, `limit`) |
| GET | `/courses/:slug` | Course detail |
| GET | `/courses/:slug/reviews` | Reviews |
| GET | `/courses/:slug/related` | Related courses |
| POST | `/courses/:slug/reviews` | Submit review (enrolled) |
| GET | `/courses/id/:id` | Course by id (player) |

## Enrollments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/enrollments/my-learning` | Enrolled / wishlist / completed |
| GET | `/enrollments/course/:courseId` | Progress for one course |
| GET | `/enrollments/check/:courseId` | Enrollment check |
| POST | `/enroll/:courseId` | Free enroll |
| PATCH | `/progress/:courseId/:lessonId` | Mark lesson complete |

## Wishlist
| Method | Path | Description |
|--------|------|-------------|
| GET | `/wishlist/check/:courseId` | In wishlist? |
| POST | `/wishlist/:courseId` | Add |
| DELETE | `/wishlist/:courseId` | Remove |

## Orders & payments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/orders/my` | Student order history |
| POST | `/orders/checkout` | Start checkout |
| POST | `/payments/verify` | Razorpay verify |
| POST | `/webhooks/razorpay` | Webhook |

## Quiz
| Method | Path | Description |
|--------|------|-------------|
| GET | `/quiz/course/:courseId` | Quiz (no answers) |
| POST | `/quiz/:quizId/attempt` | Submit attempt |

## Certificates
| Method | Path | Description |
|--------|------|-------------|
| GET | `/certificates/:enrollmentId` | PDF download |

## Student
| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/stats` | Dashboard stats |

## Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List + unread count |
| PATCH | `/notifications/read-all` | Mark all read |
| PATCH | `/notifications/:id/read` | Mark one read |

## Messages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/messages/conversations` | Inbox |
| GET | `/messages/contacts` | Users to message |
| GET | `/messages/with/:userId` | Thread |
| POST | `/messages/with/:userId` | Send |

## Instructor (approved)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/instructor/apply` | Apply |
| GET | `/instructor/courses` | My courses |
| GET/PUT/DELETE | `/instructor/courses/:id` | CRUD |
| PATCH | `/instructor/courses/:id/status` | `draft` \| `published` |
| GET/POST | `/instructor/courses/:id/quiz` | Quiz editor |
| GET | `/instructor/stats` | Dashboard |
| GET | `/instructor/earnings` | Earnings breakdown |
| GET | `/instructor/students` | Enrolled students |
| POST | `/upload/image` \| `/upload/video` | Media upload |

## Admin
| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | `/admin/categories` | Category CRUD |
| GET/PATCH | `/admin/users` | User management |
| GET/PATCH | `/admin/instructors/...` | Approve instructors |
| GET/PATCH | `/admin/courses/...` | Course moderation |
| GET | `/admin/orders` | All orders |
| GET/DELETE | `/admin/reviews` | Review moderation |
| GET | `/admin/analytics` | Platform stats |
