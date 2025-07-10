#include <iostream>
using namespace std;

int main() {
  int start = 5, end=100, max = 25;
  float min = (end - start) / max;
  int height, width;
  cin >> height >> width;

  float area = height * width;
  if(area < start){
    cout << "No discount\n";
  }
  else if( area >=end){
    cout << "Max discount\n";
  }
  else{
    float temp = area - start;;
    float discount = min;
    for(int i=0; i<temp; i++){
        discount *= discount;
    }
    cout << "Discount: " << discount << "%\n";
  }
  return 0;
}