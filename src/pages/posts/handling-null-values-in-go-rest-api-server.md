---
layout: ../../layouts/PostLayout.astro
title: "Handling Null Values in a Go REST API Server"
description: "Patterns for handling nullable values in Go REST API servers"
pubDate: 2025-05-06
tags:
- go
- rest
---

Go *famously* does not have a native `Optional` type or sum types for that matter. Handling nullable values in a typical *RESTful* web server is tricky and I have ended up with the *patterns* below.

> **TLDR** You probably want to use pointer types for *optional* fields in API responses and `sql.Null[T]` for db fields.
## sql/db
### DDL
In general, I prefer to use SQL NULL columns for values that can be absent.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    -- omitted columns...
    updated_at TIMESTAMP NULL,
);
```

An alternative is to use Go zero values and make all columns non-NULL but this is semantically incorrect, and it breaks down when the DB is accessed by external services. For instance, you might want to create [Metabase](https://www.metabase.com/) dashboards without having to add awkward Go zero-value checks everywhere such as `updated_at != 0001-01-01T00:00:00Z`. 
### Models
The simplest way to handle null values is to use pointer types.

```go
type User struct {
    ID int `db:"id"`
    UpdatedAt *time.Time `db:"updated_at"`
}

// rest of the code

if user.UpdatedAt != nil {
    // We can use UpdatedAt.
    // The value from the DB was non-NULL.
}
```

However, it's easy to forget to do the nil check, leading to potential panics. [^nilaway] 

You can also use `sql.Null[T]` types for additional type safety. 

```go
type User struct {
    ID int `db:"id"`
    Bio sql.Null[string] `db:"bio"`
}

// rest of the code

if user.Bio.Valid {
    // We can use Bio.V to access the bio value
    // The value from the DB was non-NULL.
}
```

I prefer this option for pragmatic reasons. In most usage, `sql.Null[T]` types stick out enough, encouraging the check for `.Valid`. Pointer types can sometimes be used *transparently*, equivalent to their none pointer types. 
### Pre Go 1.22.0
Whilst you can use the usual NullString, NullBool, NullFloat64, et cetera, this breaks down when you're attempting to use enums [^enums].  I have ended up implementing something akin to:

```go
// NullableStringLike represents nullable values.
// By embedding sql.NullString we get sql.Scanner and db.Valuer interfaces
// for _free_.
type NullableStringLike[T ~string] struct {
	String T
	Valid  bool
	sql.NullString
}

// ...

type UserStatus string

const (
    UserStatusActive = "active"
    UserStatusInactive = "inactive"
)

type User struct {
    Status NullableStringLike[Status] `db:"status"`
}

// ...

if User.Status.Valid {
    // Do something with User.Status.
}
```
### Helper functions
If you have `UpdateX` requests using `*T` types of the form:

```go
type UpdateUser struct {
    Bio *string `json:"bio"`
}
```

you can use helper functions such as the following `ToNull` and `ToPtr` functions to convert between pointer types and `sql.Null[T]`. In the following example you can use `ToNull` to convert update request fields to the domain model, and `ToPtr` to convert domain model fields to API responses.

```go
package nullsql

import "database/sql"

// ToNull converts a pointer to a sql.Null[T].
func ToNull[T any](s *T) sql.Null[T] {
	if s == nil {
		return sql.Null[T]{}
	}
	return sql.Null[T]{V: *s, Valid: true}
}

// ToPtr converts a sql.Null[T] to a pointer.
func ToPtr[T any](nv sql.Null[T]) *T {
	if !nv.Valid {
		return nil
	}
	return &nv.V
}
```

See the `encoding/json` section below for more details on `PATCH` request patterns.
## encoding/json
### unmarshaling
Say we have an `UpdateUser` request used in a `PATCH` call:

```go
type UpdateUserRequest struct {
    Bio *string `json:"bio"`
    // ...
}
```

We can *trivially* use a nil check to ascertain the presence/*nullness* of the field in the JSON request.

```go
if userUpdate.Bio != nil {
    // Perform validation, or update SQL query
}
```

Sometimes it may be desirable to differentiate between a field with a `null` value vs an omitted field. For instance, we may want to allow clients to explicitly set DB fields to `NULL`, whilst preserving the ability to use the zero value.

We implement our own generic type and take advantage of the fact that `UnmarshalJSON` is never called when the field is omitted.

```go
type Omittable[T any] struct {
	V       T
	Present bool
}

func (u *Omittable[T]) UnmarshalJSON(data []byte) error {
	if err := json.Unmarshal(data, &u.V); err != nil {
		return fmt.Errorf("Omittable: couldn't unmarshal JSON: %w", err)
	}

	u.Present = true
	return nil
}
```

We can then use this as follows:

```go
// api.go
type AssetUpdateRequest struct {
    Quantity Omittable[*int] `json:"quantity"`
}

// domain.go
type AssetUpdate struct {
    // If nil, quantity is not modified. Otherwise quantity is set to NULL
    // if .Valid is false, or set to the given value if .Valid is true.
    Quantity *sql.Null[int] `db:"quantity"`
}


// ...

// If quantity is omitted, do nothing. Otherwise set NULL if quantity is null
// or the given value.
if assetUpdateReq.Quantity.Present {
    // Update the field. Use sql.Null[T].Valid = false to set the field to NULL
    // if assetUpdateReq.Quantity.V == nil.
    // You can use a helper function.
}
```

You might have noticed that `Omittable` only works well for unmarshaling. We don't want to output the entire struct when unmarshaling. We can implement `MarshalJSON` and use go `1.24.0`'s `omitzero` option to fix this.

```go
func (u Omittable[T]) MarshalJSON() ([]byte, error) {
	data, err := json.Marshal(u.Val)
	if err != nil {
		return nil, fmt.Errorf("Omittable: couldn't JSON marshal: %w", err)
	}
	return data, nil
}

func (u Omittable[T]) IsZero() bool { return !u.Present }

// ...

type UpdateUserRequest struct {
    Bio *string `json:"bio,omitzero"`
    // ...
}
```

See [this](https://go.dev/play/p/dLj3oZc3Xvu) go playground code for usage examples.
### marshaling
Optional fields can be represented using zero values.

```go
type User {
    UpdatedAt time.Time `json:"updated_at"`
}
```

This will produce an awkward `{"updated_at": "0001-01-01T00:00:00Z"}` for the *absent* case forcing your clients to be aware of Go zero values.  [`omitzero`](https://github.com/golang/go/issues/45669) somewhat resolves this case, allowing omitting the field. If you're hellbent on avoiding pointers, this is a reasonable solution.

In general though, an APIs response should be *stable* and fields appearing and disappearing based on *nullness* is not ideal. In this case, a pointer should suffice.

```go
type User {
    UpdatedAt *time.Time `json:"updated_at"`
}
```

For the *nil* case the output will be `{"updated_at": null}` which is the more desirable outcome. Whilst working with pointers may be annoying e.g. you can't take the address to literal value, there are nifty workarounds. Use a helper function like:

```go
package ptr

func New[T any](v T) *T {
	return &v
}
```

I also like to have a `dto` layer for common conversions, e.g. between domain models and api responses. This will make the conversion to pointers *DRY* in your codebase. 

If it's not evident, whilst using pointers, you might want to avoid `omitempty` and `omitzero`, or at least think critically about why they're necessary.

[^nilaway]: I'd bet on [uber-go/nilaway](https://github.com/uber-go/nilaway) becoming robust enough to virtually resolve this problem, before we have sum types in Go. 
[^enums]: Go doesn't have enums (:sigh), but what passes for enums is still useful.
