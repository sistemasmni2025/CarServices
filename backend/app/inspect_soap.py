import sys
from zeep import Client
from zeep.plugins import HistoryPlugin

def inspect_soap():
    wsdl = 'http://172.16.71.204:8080/mllntqa/servlet/awsoservicio?WSDL'
    client = Client(wsdl)
    
    with open('inspect_out.txt', 'w') as f:
        # Get factory for namespace
        f.write("--- TYPES ---\n")
        
        # In Zeep, we can inspect the elements available in the global type registry
        for type_name in client.wsdl.types.types:
            f.write(f"Type: {type_name}\n")
            try:
                complex_type = client.get_type(type_name)
                for el_name, el_type in complex_type.elements:
                    f.write(f"  {el_name}: {el_type.type}\n")
            except Exception as e:
                f.write(f"  (Error reading elements: {e})\n")
        
        f.write("\n--- OPERATION DOX ---\n")
        f.write(str(client.service.Execute.__doc__))

if __name__ == '__main__':
    inspect_soap()
