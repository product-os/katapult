import (
    "list"
)

nums: [1,2,3,4,5,6]
nums: [ for index, n in nums if index == 0 { n*n } ]  // cycle error cannot modify item in-place using iteration

arrOfArr: [
    [1,2,3],
    [2,3,4],
    [5,6,7]
]

flat: list.FlattenN(arrOfArr, 1)

first: [1,2,3]
second: [4,5,6]
join: list.FlattenN([first,second], 1)


